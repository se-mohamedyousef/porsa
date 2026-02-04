import { kv } from "@vercel/kv";

// Database utility functions for NoSQL storage

// User management
export async function createUser(userData) {
  const userId = userData.id;
  const userKey = `user:${userId}`;

  try {
    await kv.set(userKey, userData);
    return { success: true, userId };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message };
  }
}

export async function getUser(userId) {
  const userKey = `user:${userId}`;

  try {
    const user = await kv.get(userKey);
    return user;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

export async function getUserByPhone(phone) {
  try {
    // Get all users and find by phone number
    const userKeys = await kv.keys("user:*");
    const users = await Promise.all(userKeys.map((key) => kv.get(key)));

    return users.find((user) => user && user.phone === phone);
  } catch (error) {
    console.error("Error getting user by phone:", error);
    return null;
  }
}

export async function getUserByEmail(email) {
  try {
    // Get all users and find by email
    const userKeys = await kv.keys("user:*");
    const users = await Promise.all(userKeys.map((key) => kv.get(key)));

    return users.find((user) => user && user.email === email);
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
}

export async function updateUser(userId, userData) {
  const userKey = `user:${userId}`;

  try {
    await kv.set(userKey, { ...userData, id: userId });
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
    const portfolio = await kv.get(portfolioKey);
    return portfolio || [];
  } catch (error) {
    console.error("Error getting portfolio:", error);
    return [];
  }
}

export async function saveUserPortfolio(userId, portfolio) {
  const portfolioKey = `portfolio:${userId}`;

  try {
    await kv.set(portfolioKey, portfolio);
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
    const profile = await kv.get(profileKey);
    return profile || { name: "", phoneNumber: "", email: "" };
  } catch (error) {
    console.error("Error getting user profile:", error);
    return { name: "", phoneNumber: "", email: "" };
  }
}

export async function saveUserProfile(userId, profileData) {
  const profileKey = `profile:${userId}`;

  try {
    await kv.set(profileKey, profileData);
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
    await kv.set(sessionKey, sessionData, { ex: 7 * 24 * 60 * 60 }); // 7 days expiry
    return { success: true };
  } catch (error) {
    console.error("Error creating session:", error);
    return { success: false, error: error.message };
  }
}

export async function getSession(userId) {
  const sessionKey = `session:${userId}`;

  try {
    const session = await kv.get(sessionKey);
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

export async function deleteSession(userId) {
  const sessionKey = `session:${userId}`;

  try {
    await kv.del(sessionKey);
    return { success: true };
  } catch (error) {
    console.error("Error deleting session:", error);
    return { success: false, error: error.message };
  }
}

// Utility functions
export async function getAllUsers() {
  try {
    const userKeys = await kv.keys("user:*");
    const users = await Promise.all(userKeys.map((key) => kv.get(key)));
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

    await Promise.all([
      kv.del(userKey),
      kv.del(portfolioKey),
      kv.del(profileKey),
      kv.del(sessionKey),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }
}
