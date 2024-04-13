const express = require("express");
const { body, validationResult } = require("express-validator");

const app = express();
const PORT = 4000;

app.use(express.json());

const rooms = [];
const customers = [];
const booking = [];

// creating room
app.post(
  "/rooms/create",
  [
    body("roomName").notEmpty().isString(),
    body("seatsTotal").notEmpty().isInt(),
    body("amenities").notEmpty().isArray(),
    body("pricePerHour").notEmpty().isFloat(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ errors: errors.array() });
    }

    const room = {};
    room.roomId = rooms.length + 1;
    room.seatsBooked = 0;
    room.seatsAvailable = req.body.seatsTotal;
    Object.assign(room, req.body);
    rooms.push(room);
    res.status(201).send(room);
  }
);

// create customer
app.post(
  "/customer/create",
  body("customerName").notEmpty().isString(),
  (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customer = {};

    customer.customerId = customers.length + 1;
    customer.bookingHistory = [];

    Object.assign(customer, req.body);
    customers.push(customer);
    res.status(201).json({
      message: `Your account has been created with customer_id of ${customer.customerId}`,
    });
  }
);

// booking rooms
app.post(
  "/rooms/booking/:roomId",

  [
    body("roomId").notEmpty().isInt({ gt: 0 }),
    body("roomName").notEmpty().isString(),
    body("customerId").notEmpty().isInt(),
    body("customerName").notEmpty().isString(),
    body("dateOfBooking").notEmpty().isDate({ format: "DD-MM-YYYY" }),
    body("startTime").notEmpty().isString(),
    body("endTime").notEmpty().isString(),
    body("seatsRequired").notEmpty().isInt({ gt: 0 }),
  ],

  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ errors: errors.array() });
    }

    const customer = customers.find(
      (cust) => cust.customerId == req.body.customerId
    );

    if (!customer) {
      return res.json({
        message: "You are not an existing customer, please signup!",
      });
    }

    if (customer.customerName != req.body.customerName) {
      return res.json({ message: `Your name and customer id didn't match` });
    }

    if (rooms.length === 0) {
      return res.status(404).json({ message: "No rooms available" });
    }

    const roomId = req.params.roomId;
    const room = rooms.find((room) => room.roomId == parseInt(roomId));

    if (!room) {
      return res
        .status(404)
        .json({ message: `Sorry, room number:${roomId} is not found` });
    }

    if (room.roomName != req.body.roomName) {
      return res.json({ message: "roomId didn't match with room name" });
    }

    if (parseInt(roomId) != req.body.roomId) {
      return res.json({
        message: `requested roomId ${roomId} is not available`,
      });
    }

    const bookingInfo = req.body;

    let updatedRoom;

    if (room.seatsAvailable === 0) {
      return res.json({
        message: "All seats booked, try in next available rooms",
      });
    }

    if (bookingInfo.seatsRequired > room.seatsAvailable) {
      return res.json({
        message: `Sorry for inconvenience, you can not book more than available seats ${room.seatsAvailable}`,
      });
    }

    bookingInfo.bookingId = booking.length + 1;
    booking.push(bookingInfo);

    room.seatsBooked += bookingInfo.seatsRequired;
    room.seatsAvailable = room.seatsTotal - room.seatsBooked;
    bookingInfo.isBooked = true;

    updatedRoom = room;

    rooms.forEach((room, index) => {
      if (room.id == roomId) {
        rooms[index] = updatedRoom;
      }
    });

    customer.bookingHistory.push(bookingInfo);

    res.status(201).send(bookingInfo);
  }
);

// get rooms
app.get("/rooms", (req, res) => {
  res.send(rooms);
});

app.listen(PORT, () => {
  console.log("server connected successfully!");
});

// rooms' booking history

app.get("/rooms/booking/history", (req, res) => {
  res.json({ message: booking });
});

// get customers information

app.get("/customers", (req, res) => {
  res.json({ message: customers });
});
