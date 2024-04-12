const express = require("express");
const { body, validationResult } = require("express-validator");

const app = express();
const PORT = 4000;

app.use(express.json());

const rooms = [];
const booking = [];

// creating room
app.post(
  "/rooms/create",
  [
    body("seatsAvailable").notEmpty().isInt(),
    body("amenities").notEmpty().isArray(),
    body("pricePerHour").notEmpty().isFloat(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ errors: errors.array() });
    }

    const room = {};
    room.id = rooms.length + 1;
    room.seatsBooked = 0;
    Object.assign(room, req.body);
    rooms.push(room);
    res.status(201).send(room);
  }
);

// booking rooms

app.post(
  "/rooms/book/:roomId",

  [
    body("customerName").notEmpty().isAlphanumeric(),
    body("dateOfBooking").notEmpty().isDate({ format: "DD-MM-YYYY" }),
    body("startTime").notEmpty().isString(),
    body("endTime").notEmpty().isString(),
    body("seatsRequired").notEmpty().isInt(),
  ],

  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ errors: errors.array() });
    }

    if (rooms.length === 0) {
      return res.status(404).json({ message: "No rooms available" });
    }

    const roomId = req.params.roomId;
    const room = rooms.find((room) => room.id == parseInt(roomId));

    if (!room) {
      return res
        .status(404)
        .json({ message: `Room is not found with number ${roomId}` });
    }

    const bookingInfo = req.body;

    let updatedRoom;

    if (
      bookingInfo.seatsRequired <= room.seatsAvailable &&
      bookingInfo.seatsRequired > 0
    ) {
      bookingInfo.bookingId = booking.length + 1;
      booking.push(bookingInfo);

      room.seatsBooked += bookingInfo.seatsRequired;
      bookingInfo.isBooked = true;

      updatedRoom = room;

      rooms.forEach((room, index) => {
        if (room.id == roomId) {
          rooms[index] = updatedRoom;
        }
      });
    }

    res.status(201).send(bookingInfo);
    console.log(booking);
  }
);

// get rooms
app.get("/rooms", (req, res) => {
  res.send(rooms);
});

app.listen(PORT, () => {
  console.log("server connected successfully!");
});
