const express = require("express");
const router = express.Router();
const Note = require("../models/noteSchema");
const fetchuser = require("../middleware/fetchUser");

// get all the notes using: GET "/fetchallnotes"  login required
router.get("/fetchallnotes", fetchuser, async (req, res) => {
    try {
      const notes = await Note.find({ user: req.user.id });
      return res.status(200).json(notes);
    } catch (error) {
      return res.status(400).json({error: "Internal server error"});
    }
  });

//   add a new note using: POST "/addnote"  login required
  router.get("/addnote", fetchuser, async (req, res) => {
    try {
        const { title, description, tag } = req.body;
        const note = new Note({
          title,
          description,
          tag,
          user: req.user.id,
        });
        const savednote = await note.save();
        return res.status(200).json({message: "Note saved successfully"}, savednote);
      } catch (error) {
        return res.status(400).json({error: "Internal server error"});
      }
  });

module.exports = router;