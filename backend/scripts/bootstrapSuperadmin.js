import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/userModel.js';

dotenv.config();

const defaultEmail = process.env.SUPERADMIN_EMAIL || 'realtime.superadmin@gmail.com';
const defaultPassword = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@123';

const bootstrapSuperadmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const user = await User.findOneAndUpdate(
      { email: defaultEmail },
      {
        email: defaultEmail,
        password: hashedPassword,
        role: 'superadmin',
        department: 'ALL',
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log(
      JSON.stringify(
        {
          message: 'Superadmin is ready',
          email: user.email,
          role: user.role,
          password: defaultPassword,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error('Failed to bootstrap superadmin:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

bootstrapSuperadmin();
