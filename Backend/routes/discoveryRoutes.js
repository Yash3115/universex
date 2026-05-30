const express = require("express");
const { requestConnection, respondToConnection, searchStudents } = require("../controllers/discoveryController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.get("/students", searchStudents);
router.post("/connections", requestConnection);
router.put("/connections/:id", respondToConnection);

module.exports = router;