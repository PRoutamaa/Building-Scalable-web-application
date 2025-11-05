import { authClient } from "../utils/auth.js";

let userState = $state({ loading: true });
let userStatePromise = null;

const getUserFromSession = () => {
  console.log(userStatePromise)
  if (userStatePromise) {
    return;
  }

  userStatePromise = userStatePromise || authClient.getSession();
  userStatePromise.then((session) => {
    if (session?.data?.user?.email) {
      console.log(session?.data?.user);
      userState = session?.data?.user;
    } else {
      userState = { email: null };
      console.log(userState);
    }
  });
};

const useUserState = () => {
  if (import.meta.env.SSR) {
    console.log("Hello SSR")
    console.log(userState)
  } else if (!userState?.email) {
    getUserFromSession();
  }

  return {
    get loading() {
      console.log("hello", userState?.loading)
      return userState?.loading;
    },
    get email() {
      return userState?.email;
    },
  };
};

export { useUserState };