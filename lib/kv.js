import { Redis } from '@upstash/redis';

// Initialize Redis using existing Vercel KV environment variables
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});
const kvStore = redis;

console.log("[KV] Using Upstash Redis");

// User management
export async function createUser(userData) {
  const userId = userData.id;
  const userKey = `user:${userId}`;

  try {
    // Create user record
    await kvStore.set(userKey, userData);
    
    // Create index entries for O(1) lookups
    if (userData.phone) {
      await kvStore.set(`phone:index:${userData.phone}`, userId);
    }
    if (userData.email) {
      await kvStore.set(`email:index:${userData.email}`, userId);
    }
    
    return { success: true, userId };
  } catch (error) {
    console.error("Error creating user:", error.message);
    return { success: false, error: error.message };
  }
}

export async function getUser(userId) {
  const userKey = `user:${userId}`;

  try {
    const user = await kvStore.get(userKey);
    return user;
  } catch (error) {
    console.error("Error getting user:", error.message);
    return null;
  }
}

export async function getUserByPhone(phone) {
  try {
    // O(1) lookup using phone index
    const userId = await kvStore.get(`phone:index:${phone}`);
    if (!userId) return null;
    
    return await getUser(userId);
  } catch (error) {
    console.error("Error getting user by phone:", error.message);
    return null;
  }
}

export async function getUserByEmail(email) {
  try {
    // O(1) lookup using email index
    const userId = await kvStore.get(`email:index:${email}`);
    if (!userId) return null;
    
    return await getUser(userId);
  } catch (error) {
    console.error("Error getting user by email:", error.message);
    return null;
  }
}

export async function updateUser(userId, userData) {
  const userKey = `user:${userId}`;

  try {
    // Get old user data to update indexes if email/phone changed
    const oldUser = await kvStore.get(userKey);
    
    // Update user record
    await kvStore.set(userKey, { ...userData, id: userId });
    
    // Update email index if changed
    if (oldUser?.email !== userData.email) {
      if (oldUser?.email) {
        await kvStore.del(`email:index:${oldUser.email}`);
      }
      if (userData.email) {
        await kvStore.set(`email:index:${userData.email}`, userId);
      }
    }
    
    // Update phone index if changed
    if (oldUser?.phone !== userData.phone) {
      if (oldUser?.phone) {
        await kvStore.del(`phone:index:${oldUser.phone}`);
      }
      if (userData.phone) {
        await kvStore.set(`phone:index:${userData.phone}`, userId);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error updating user:", error);
    return { success: false, error: error.message };
  }
}

// Portfolio management
export async function getUserPortfolio(userId) {
  const portfolioKey = `portfolio:${userId}`;

  try {
    const portfolio = await kvStore.get(portfolioKey);
    return portfolio || [];
  } catch (error) {
    console.error("Error getting portfolio:", error);
    return [];
  }
}

export async function saveUserPortfolio(userId, portfolio) {
  const portfolioKey = `portfolio:${userId}`;

  try {
    await kvStore.set(portfolioKey, portfolio);
    return { success: true };
  } catch (error) {
    console.error("Error saving portfolio:", error);
    return { success: false, error: error.message };
  }
}

export async function addStockToPortfolio(userId, stockData) {
  try {
    const portfolio = await getUserPortfolio(userId);
    const updatedPortfolio = [...portfolio, stockData];
    await saveUserPortfolio(userId, updatedPortfolio);
    return { success: true, portfolio: updatedPortfolio };
  } catch (error) {
    console.error("Error adding stock:", error);
    return { success: false, error: error.message };
  }
}

export async function removeStockFromPortfolio(userId, stockId) {
  try {
    const portfolio = await getUserPortfolio(userId);
    const updatedPortfolio = portfolio.filter((stock) => stock.id !== stockId);
    await saveUserPortfolio(userId, updatedPortfolio);
    return { success: true, portfolio: updatedPortfolio };
  } catch (error) {
    console.error("Error removing stock:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePortfolio(userId, portfolio) {
  try {
    await saveUserPortfolio(userId, portfolio);
    return { success: true };
  } catch (error) {
    console.error("Error updating portfolio:", error);
    return { success: false, error: error.message };
  }
}

// User profile management
export async function getUserProfile(userId) {
  const profileKey = `profile:${userId}`;

  try {
    const profile = await kvStore.get(profileKey);
    return profile || { name: "", phoneNumber: "", email: "" };
  } catch (error) {
    console.error("Error getting user profile:", error);
    return { name: "", phoneNumber: "", email: "" };
  }
}

export async function saveUserProfile(userId, profileData) {
  const profileKey = `profile:${userId}`;

  try {
    await kvStore.set(profileKey, profileData);
    return { success: true };
  } catch (error) {
    console.error("Error saving user profile:", error);
    return { success: false, error: error.message };
  }
}

// Session management
export async function createSession(userId, sessionData) {
  const sessionKey = `session:${userId}`;

  try {
    await kvStore.set(sessionKey, sessionData, { ex: 7 * 24 * 60 * 60 }); // 7 days expiry
    return { success: true };
  } catch (error) {
    console.error("Error creating session:", error);
    return { success: false, error: error.message };
  }
}

export async function getSession(userId) {
  const sessionKey = `session:${userId}`;

  try {
    const session = await kvStore.get(sessionKey);
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

export async function deleteSession(userId) {
  const sessionKey = `session:${userId}`;

  try {
    await kvStore.del(sessionKey);
    return { success: true };
  } catch (error) {
    console.error("Error deleting session:", error);
    return { success: false, error: error.message };
  }
}

// Utility functions
export async function getAllUsers() {
  try {
    const userKeys = await kvStore.keys("user:*");
    const users = await Promise.all(userKeys.map((key) => kvStore.get(key)));
    return users.filter((user) => user !== null);
  } catch (error) {
    console.error("Error getting all users:", error);
    return [];
  }
}

export async function deleteUser(userId) {
  try {
    const userKey = `user:${userId}`;
    const portfolioKey = `portfolio:${userId}`;
    const profileKey = `profile:${userId}`;
    const sessionKey = `session:${userId}`;
    
    // Get user data to clean up indexes
    const user = await kvStore.get(userKey);

    const deletions = [
      kvStore.del(userKey),
      kvStore.del(portfolioKey),
      kvStore.del(profileKey),
      kvStore.del(sessionKey),
    ];
    
    // Clean up index entries
    if (user?.email) {
      deletions.push(kvStore.del(`email:index:${user.email}`));
    }
    if (user?.phone) {
      deletions.push(kvStore.del(`phone:index:${user.phone}`));
    }
    
    await Promise.all(deletions);

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }
}
