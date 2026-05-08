export const buildJourney = ({
  profileCompleted,
  favoritesCount,
  recentCount,
  bookingsCount,
  waitlistCount,
  reviewsCount
}) => {
  const points =
    (profileCompleted ? 40 : 0) +
    favoritesCount * 10 +
    recentCount * 4 +
    bookingsCount * 20 +
    waitlistCount * 8 +
    reviewsCount * 15;
  const level = Math.max(1, Math.floor(points / 50) + 1);
  const streak = Math.max(1, Math.min(7, favoritesCount + bookingsCount + reviewsCount));

  const quests = [
    { id: "profile", progress: profileCompleted ? 1 : 0, target: 1 },
    { id: "favorites", progress: Math.min(favoritesCount, 3), target: 3 },
    { id: "booking", progress: Math.min(bookingsCount, 1), target: 1 },
    { id: "review", progress: Math.min(reviewsCount, 1), target: 1 }
  ];

  const nextQuest = quests.find((quest) => quest.progress < quest.target) || quests[quests.length - 1];
  const badges = [
    { id: "profile", earned: profileCompleted },
    { id: "explorer", earned: favoritesCount >= 3 || recentCount >= 3 },
    { id: "booking", earned: bookingsCount >= 1 },
    { id: "review", earned: reviewsCount >= 1 }
  ];

  return {
    points,
    level,
    streak,
    waitlistCount,
    nextQuest,
    badges
  };
};
