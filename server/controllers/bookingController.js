import Booking from "../model/Booking.js";
import { sendEmail } from "../utils/sendEmail.js"; // Ensure .js extension for ES Modules
import { createEvent } from "../services/googleCalendarService.js"; // Ensure .js extension
import { sendWhatsAppMessage } from "../services/whatsappService.js"; // Ensure .js extension

// Helper function to calculate end time based on start time and duration
function calculateEndTime(start, duration) {
  const [hr, min] = start.split(":").map(Number);
  const date = new Date();
  date.setHours(hr);
  date.setMinutes(min + duration);
  // Using toLocaleTimeString for potential better formatting, or keep slice(0,5)
  // return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return date.toTimeString().slice(0, 5); // Returns HH:MM
}

export const createBooking = async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      session_type,
      timezone,
      date,
      start_time,
      duration,
    } = req.body;

    const endTime = calculateEndTime(start_time, duration);

    // --- Sequelize: Create a new booking record ---
    const newBooking = await Booking.create({
      full_name,
      email,
      phone,
      session_type,
      timezone,
      date, // date: 'YYYY-MM-DD'
      start_time, // start_time: 'HH:MM' or 'HH:MM:SS'
      end_time: endTime, // end_time: 'HH:MM' or 'HH:MM:SS'
      duration,
    });

    // newBooking is now a Sequelize instance, representing the created record.
    // Its data is directly accessible (e.g., newBooking.id, newBooking.email)

    // Notify via email (use newBooking.email and newBooking.full_name)
    await sendEmail(
      newBooking.email,
      `You're booked for ${newBooking.session_type}`,
      `Details: Your session with ${newBooking.session_type} is scheduled for ${newBooking.date} at ${newBooking.start_time} ${newBooking.timezone}.`
    );
    await sendEmail(
      process.env.ADMIN_EMAIL,
      `New Booking Notification`,
      `A new booking has been made by ${newBooking.full_name} (${newBooking.email}) for ${newBooking.session_type} on ${newBooking.date} at ${newBooking.start_time}.`
    );

    // Create Calendar Event (pass the Sequelize instance, or specific data from it)
    await createEvent(newBooking.toJSON()); // .toJSON() converts Sequelize instance to plain JS object

    // WhatsApp alert to admin
    await sendWhatsAppMessage(
      `New booking from ${newBooking.full_name} at ${newBooking.start_time} on ${newBooking.date}`
    );

    res
      .status(201)
      .json({ message: "Booking confirmed!", booking: newBooking }); // Optionally return the created booking
  } catch (err) {
    console.error("Error in createBooking:", err); // Log the specific error for debugging
    // Check for specific Sequelize errors (e.g., validation or unique constraint errors)
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message:
          "A booking with this email already exists or time slot is taken.",
      });
    }
    if (err.name === "SequelizeValidationError") {
      return res.status(400).json({
        message: "Validation error: " + err.message,
        errors: err.errors.map((e) => e.message),
      });
    }
    res.status(500).send("Error creating booking");
  }
};
