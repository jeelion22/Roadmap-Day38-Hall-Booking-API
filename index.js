// server packages are imported
const express = require("express");
const { body, validationResult } = require("express-validator");

// initiallize app and enable port
const app = express();
const PORT = 4000;

// add middleware for json for body
app.use(express.json());

// initialize necessary variables
const rooms = [];
const customers = [];
const booking = [];

// root
app.get("/", (req, res) => {
  res.send({
    message: {
      info_for_rooms: "if rooms not available for booking, then create rooms",
      info_for_customers: "To book seats in a hall, you need to sign up",
    },
  });
});

// route creating room
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

// route for creating customer
// it accepts only customer name
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
      message: `Your account has been created successfully! with customer_id of ${customer.customerId}`,
    });
  }
);

// route for booking rooms
// it is enabled only for registered customers
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

    // finds customer by custermerId
    const customer = customers.find(
      (cust) => cust.customerId == req.body.customerId
    );

    // if customer is not available, asks customer for signing up
    if (!customer) {
      return res.json({
        message: "You are not an existing customer, please signup!",
      });
    }

    // checks matching of customer name with existing custmer(as found by id )
    if (customer.customerName != req.body.customerName) {
      return res.json({ message: `Your name and customer id didn't match` });
    }

    // if no rooms creared, your want to create it first
    if (rooms.length === 0) {
      return res.status(404).json({ message: "No rooms available" });
    }

    // checks room availability with given roomId
    const roomId = req.params.roomId;
    const room = rooms.find((room) => room.roomId == parseInt(roomId));

    if (!room) {
      return res
        .status(404)
        .json({ message: `Sorry, room number:${roomId} is not found` });
    }

    // checks roomId matches withroomName
    if (room.roomName != req.body.roomName) {
      return res.json({ message: "roomId didn't match with room name" });
    }

    // checks customer sent room id with existing roomId **With Params passed to the path**
    if (parseInt(roomId) != req.body.roomId) {
      return res.json({
        message: `requested roomId ${req.body.roomId} didn't match with  ${roomId}(params) `,
      });
    }

    // stores booking information
    const bookingInfo = req.body;

    // initialize update room
    let updatedRoom;

    // checks seets availability
    if (room.seatsAvailable === 0) {
      return res.json({
        message: "All seats booked, try in next available rooms",
      });
    }

    // checks requested seats is more than available
    if (bookingInfo.seatsRequired > room.seatsAvailable) {
      return res.json({
        message: `Sorry for inconvenience, you can not book more than available seats ${room.seatsAvailable}`,
      });
    }

    // created booking is
    bookingInfo.bookingId = booking.length + 1;
    booking.push(bookingInfo);

    // updates seatsBooked in room
    room.seatsBooked += bookingInfo.seatsRequired;

    // updates seats availablity in the room
    room.seatsAvailable = room.seatsTotal - room.seatsBooked;

    // adds booking status
    bookingInfo.isBooked = true;

    // asigns room to updated room
    // updatedRoom = room;

    // rooms.forEach((room, index) => {
    //   if (room.id == roomId) {
    //     rooms[index] = updatedRoom;
    //   }
    // });

    customer.bookingHistory.push(bookingInfo);

    res.status(201).send(bookingInfo);
  }
);

// get rooms information
app.get("/rooms", (req, res) => {
  res.send({ message: rooms });
});

// rooms' booking history
app.get("/rooms/booking/history", (req, res) => {
  res.json({ message: booking });
});

// get customers information
app.get("/customers", (req, res) => {
  res.json({ message: customers });
});

// webserver listening
app.listen(PORT, () => {
  console.log("server connected successfully!");
});
