const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Age must be a whole number',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
