import User from "../models/User.js";
import deviceModel from "../models/Device.js";
import pushNotificationService from "../services/pushNotificationService.js";


const followUser = async (req, res) => {
  const userIdToFollow = req.params.userId;
  console.log("User ID to follow:", userIdToFollow);
  const currentUserId = req.user.id;
  if (userIdToFollow === currentUserId) { 
    return res.status(400).json({ message: "You cannot follow yourself." });
  }
  try {
    const userToFollow = await User.findById(userIdToFollow);
    const currentUser = await User.findById(currentUserId);
    if (!userToFollow) {
      return res.status(404).json({ message: "User not found." });
    }
    // Proceed with the follow logic
  userToFollow.followers.push(currentUserId);
  currentUser.following.push(userIdToFollow);
    await userToFollow.save();
    await currentUser.save();

    const deviceToken = await deviceModel.findOne({ userId: userIdToFollow });
   pushNotificationService.sendToDevice(
      deviceToken.deviceToken,
      {
        title: "New Follower",
        body: `${currentUser.fullName} is now following you.`,
      }
    );


    return res.status(200).json({ message: "Successfully followed the user." });




  } catch (error) {
    console.error("Error following user:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const unfollowUser = async (req, res) => {
  const userIdToUnfollow = req.params.userId;
  const currentUserId = req.user.id;
  if (userIdToUnfollow === currentUserId) { 
    return res.status(400).json({ message: "You cannot unfollow yourself." });
  }
  try {
    const userToUnfollow = await User.findById(userIdToUnfollow);
    const currentUser = await User.findById(currentUserId);
    if (!userToUnfollow) {
      return res.status(404).json({ message: "User not found." });
    }
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found." });
    }
    userToUnfollow.followers.pull(currentUserId);
    currentUser.following.pull(userIdToUnfollow);
    await userToUnfollow.save();
    await currentUser.save();
    return res.status(200).json({ message: "Successfully unfollowed the user." });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
const unfolloFollower = async (req, res) => {
  const userIdToUnfollow = req.params.userId;
  const currentUserId = req.user.id;
  if (userIdToUnfollow === currentUserId) { 
    return res.status(400).json({ message: "You cannot unfollow yourself." });
  }
  try {
    const userToUnfollow = await User.findById(userIdToUnfollow);
    const currentUser = await User.findById(currentUserId);
    if (!userToUnfollow) {
      return res.status(404).json({ message: "User not found." });
    }
    if (!currentUser) {
      return res.status(404).json({ message: "Current user not found." });
    }
    userToUnfollow.followers.pull(currentUserId);
    currentUser.following.pull(userIdToUnfollow);
    await userToUnfollow.save();
    await currentUser.save();
    return res.status(200).json({ message: "Successfully unfollowed the user.", user: userToUnfollow });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export { followUser, unfollowUser, unfolloFollower };