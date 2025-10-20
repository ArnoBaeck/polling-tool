require("dotenv").config();
const HTTP = require("http");
const EXPRESS = require("express");
const CORS = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const { Server } = require("socket.io");

const APP = EXPRESS();
const SERVER = HTTP.createServer(APP);
const IO = new Server(SERVER, { cors: { origin: "*" } });

const isValidObjectId = (s) => /^[a-fA-F0-9]{24}$/.test(s);

APP.use(CORS());
APP.use(EXPRESS.json());

const client = new MongoClient(process.env.DB_URL);
let db;
const collection = (name) => db.collection(name);

async function pushResults(pollId) {
	const _id = new ObjectId(pollId);
	const poll = await collection("polls").findOne({ _id });
	if (!poll) return;

	const options = poll.options || [];

	const agg = await collection("votes")
		.aggregate([{ $match: { poll_id: _id } }, { $group: { _id: "$option_id", count: { $sum: 1 } } }])
		.toArray();

	const counts = new Map(agg.map((a) => [String(a._id), a.count]));
	const series = options.map((option) => ({
		optionId: String(option._id),
		label: option.label,
		count: counts.get(String(option._id)) || 0,
	}));

	IO.to(`poll:${pollId}`).emit("results:update", { pollId, series });
}

IO.on("connection", (socket) => {
	console.log("socket connected", socket.id);
	socket.on("join-poll", ({ pollId }) => {
		if (pollId) {
			console.log(`join room poll:${pollId}`, socket.id);
			socket.join(`poll:${pollId}`);
		}
	});
	socket.on("leave-poll", ({ pollId }) => {
		if (pollId) {
			console.log(`leave room poll:${pollId}`, socket.id);
			socket.leave(`poll:${pollId}`);
		}
	});
	socket.on("disconnect", (reason) => {
		console.log("socket disconnected", socket.id, reason);
	});
});

APP.post("/polls", async (request, response) => {
	const { title, options } = request.body;
	if (!title || !Array.isArray(options) || !options.length) {
		return response.status(400).json({ error: "title and options are required" });
	}

	const doc = {
		title,
		status: "live",
		options: options.map((label) => ({ _id: new ObjectId(), label })),
		created_at: new Date(),
	};

	const { insertedId } = await collection("polls").insertOne(doc);
	return response.status(201).json({ poll_id: String(insertedId) });
});

APP.get("/polls/:id", async (request, response) => {
	const { id } = request.params;
	if (!isValidObjectId(id)) return response.status(400).json({ error: "invalid poll id" });

	const _id = new ObjectId(id);
	const poll = await collection("polls").findOne({ _id });
	if (!poll) return response.status(404).json({ error: "Poll not found" });

	response.json({
		poll: { id: String(poll._id), title: poll.title, status: poll.status },
		options: poll.options.map((o) => ({ id: String(o._id), label: o.label })),
	});
});

APP.get("/polls/:id/results", async (request, response) => {
	const { id } = request.params;
	if (!isValidObjectId(id)) return response.status(400).json({ error: "invalid poll id" });

	const pollId = new ObjectId(id);
	const poll = await collection("polls").findOne({ _id: pollId });
	if (!poll) return response.status(404).json({ error: "not found" });

	const agg = await collection("votes")
		.aggregate([{ $match: { poll_id: pollId } }, { $group: { _id: "$option_id", count: { $sum: 1 } } }])
		.toArray();

	const counts = new Map(agg.map((a) => [String(a._id), a.count]));
	const results = (poll.options || []).map((o) => ({
		optionId: String(o._id),
		label: o.label,
		count: counts.get(String(o._id)) || 0,
	}));
	response.json({ pollId: String(pollId), results });
});

APP.post("/votes", async (request, response) => {
	const { poll_id, option_id, session_id } = request.body;
	if (!poll_id || !option_id || !session_id) {
		return response.status(400).json({ error: "poll_id, option_id and session_id are required" });
	}

	const poll = await collection("polls").findOne({ _id: new ObjectId(poll_id) });
	if (!poll || poll.status !== "live") {
		return response.status(400).json({ error: "Poll not found or not live" });
	}

	const valid = poll.options.some((option) => String(option._id) === option_id);
	if (!valid) return response.status(400).json({ error: "Invalid option_id" });

	try {
		await collection("votes").insertOne({
			poll_id: new ObjectId(poll_id),
			option_id: new ObjectId(option_id),
			session_id,
			created_at: new Date(),
		});
	} catch (error) {
		if (error.code === 11000) {
			return response.status(409).json({ error: "You have already voted in this poll" });
		}
		throw error;
	}

	pushResults(poll_id);
	return response.status(201).json({ message: "Vote recorded" });
});

APP.get("/polls/:id/results", async (request, response) => {
	const pollId = new ObjectId(request.params.id);
	const poll = await collection("polls").findOne({ _id: pollId });
	if (!poll) return response.status(404).json({ error: "not found" });

	const agg = await collection("votes")
		.aggregate([{ $match: { poll_id: pollId } }, { $group: { _id: "$option_id", count: { $sum: 1 } } }])
		.toArray();

	const counts = new Map(agg.map((a) => [String(a._id), a.count]));
	const results = (poll.options || []).map((o) => ({
		optionId: String(o._id),
		label: o.label,
		count: counts.get(String(o._id)) || 0,
	}));
	return response.json({ pollId: String(pollId), results });
});

(async () => {
	await client.connect();
	db = client.db(process.env.DB_NAME || "polling-tool");

	await collection("votes")
		.createIndex({ poll_id: 1, session_id: 1 }, { unique: true })
		.catch(() => {});
	await collection("votes")
		.createIndex({ poll_id: 1, option_id: 1 })
		.catch(() => {});

	SERVER.listen(process.env.PORT || 8080, () => {
		console.log(`API on :${process.env.PORT || 8080}`);
	});
})();

APP.use((err, request, response, next) => {
  console.error(err);
  if (response.headersSent) return next(err);
  response.status(500).json({ error: "Server error" });
});