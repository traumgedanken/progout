const express = require("express");
const auth = require("../config/auth");
module.exports = () => {
    const router = express.Router();

    router.get("/", (req, res) => {
        const data = {};
        if (req.user) auth.updateData(data, req);
        res.render("developer_v1", data);
    });

    return router;
};
