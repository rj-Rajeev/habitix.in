import User from "@/models/User";

export function findOtherPeople(currentUserId: string) {
  return User.find({
    _id: { $ne: currentUserId },
  }).select("_id fullname");
}

export function findPeopleByIds(userIds: string[]) {
  return User.find({ _id: { $in: userIds } }).select("_id fullname");
}

export function findPersonById(userId: string) {
  return User.findById(userId).select("_id fullname");
}
