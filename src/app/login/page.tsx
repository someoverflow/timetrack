//#region Imports
import LoginPage from "./login";
//#endregion

export default function Page() {
  return <LoginPage image={process.env.LOGIN_IMAGE} />;
}
