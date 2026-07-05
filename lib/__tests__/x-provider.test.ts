import { mapRawUser } from "@/lib/x-provider";

/**
 * A trimmed capture of a real twitter241 `/user` response (elonmusk). The point
 * of these tests: pin the field split that once caused a "not found" bug —
 * created_at / name / screen_name live under `core`, counts under `legacy`,
 * protected under `privacy`, and the blue check under `is_blue_verified`.
 */
const twitter241Elon = {
  result: {
    data: {
      user: {
        result: {
          __typename: "User",
          core: {
            created_at: "Tue Jun 02 20:12:29 +0000 2009",
            name: "Elon Musk",
            screen_name: "elonmusk",
          },
          avatar: { image_url: "https://pbs.twimg.com/x_normal.jpg" },
          is_blue_verified: true,
          legacy: {
            description: "Starmind",
            followers_count: 240705620,
            friends_count: 1366,
            listed_count: 169874,
            media_count: 4588,
            statuses_count: 105231,
            favourites_count: 237869,
          },
          privacy: { protected: false },
          verification: { verified: false },
          rest_id: "44196397",
        },
      },
    },
  },
};

describe("mapRawUser — twitter241 (core/legacy/privacy) shape", () => {
  it("reads created_at from core, not legacy (the bug this guards)", () => {
    expect(mapRawUser(twitter241Elon)?.created_at).toBe(
      "Tue Jun 02 20:12:29 +0000 2009"
    );
  });

  it("maps follower/friend/listed counts from legacy", () => {
    const d = mapRawUser(twitter241Elon)!;
    expect(d.followers_count).toBe(240705620);
    expect(d.friends_count).toBe(1366);
    expect(d.listed_count).toBe(169874);
    expect(d.statuses_count).toBe(105231);
  });

  it("reads protected from privacy and the blue check from is_blue_verified", () => {
    const d = mapRawUser(twitter241Elon)!;
    expect(d.protected).toBe(false);
    expect(d.blue_verified).toBe(true);
  });

  it("populates _userInfo with the handle from core.screen_name", () => {
    const info = mapRawUser(twitter241Elon)?._userInfo;
    expect(info?.username).toBe("elonmusk");
    expect(info?.name).toBe("Elon Musk");
    expect(info?.profilePicture).toBe("https://pbs.twimg.com/x_normal.jpg");
  });
});

describe("mapRawUser — fallback and empty cases", () => {
  it("falls back to the older all-in-legacy shape", () => {
    const legacyShape = {
      result: {
        data: {
          user: {
            result: {
              rest_id: "1",
              legacy: {
                screen_name: "bob",
                name: "Bob",
                created_at: "Wed Jan 01 00:00:00 +0000 2020",
                followers_count: 5,
                friends_count: 2,
                verified: false,
              },
            },
          },
        },
      },
    };
    const d = mapRawUser(legacyShape)!;
    expect(d._userInfo?.username).toBe("bob");
    expect(d.created_at).toBe("Wed Jan 01 00:00:00 +0000 2020");
    expect(d.followers_count).toBe(5);
  });

  it("returns null when there is no user object", () => {
    expect(mapRawUser({ result: { data: { user: null } } })).toBeNull();
    expect(mapRawUser({})).toBeNull();
    expect(mapRawUser(null)).toBeNull();
  });
});
