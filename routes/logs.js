const express = require("express");
const auth = require("../config/auth");
const Log = require("../models/log");

module.exports = path => {
    const router = express.Router();

    // for admin only
    router.get("/", auth.checkAdmin(path), async (req, res) => {
        try {
            const data = { logs_button: true };
            auth.updateData(data, req);
            res.render("logs", data);
        } catch (err) {
            Log.handleError(path, req, res, { code: 500, message: err.message });
        }
    });

    return router;
};
