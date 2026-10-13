import { findOtherPeople } from "@/modules/people-chat/repositories/people.repository";

export function getPeopleDirectory(currentUserId: string) {
  return findOtherPeople(currentUserId);
}
