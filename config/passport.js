import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

// User authentication strategy
passport.use(
  'local',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isMatch = await user.matchPassword(password);
        
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Admin authentication strategy
passport.use(
  'admin-local',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const admin = await Admin.findOne({ email }).select('+password');
        
        if (!admin) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isMatch = await admin.matchPassword(password);
        
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, admin);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize user/admin for session (store type and id)
passport.serializeUser((user, done) => {
  // Store both the id and type (user or admin) to differentiate during deserialization
  const sessionData = {
    id: user._id.toString(),
    type: user.constructor.modelName === 'Admin' ? 'admin' : 'user'
  };
  done(null, sessionData);
});

// Deserialize user/admin from session
passport.deserializeUser(async (sessionData, done) => {
  try {
    if (!sessionData || typeof sessionData === 'string') {
      // Handle old format (just id)
      const user = await User.findById(sessionData);
      return done(null, user);
    }
    
    const { id, type } = sessionData;
    
    if (type === 'admin') {
      const admin = await Admin.findById(id);
      return done(null, admin);
    } else {
      const user = await User.findById(id);
      return done(null, user);
    }
  } catch (error) {
    done(error, null);
  }
});

export default passport;

