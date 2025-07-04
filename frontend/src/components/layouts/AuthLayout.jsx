import UI_IMG from "../../assets/auth-img-1.png";
import AUTH_IMG from "../../assets/bg-img.png";

const AuthLayout = ({ children }) => {
  return (
    <div className="flex">
      <div className="w-screen h-screen md:w-[60vw] px-12 pt-8 pb-12">
        <h2 className="text-lg font-medium text-black">Task Manager</h2>
        {children}
      </div>
      <div
        className="hidden md:flex w-[40vw] h-screen items-center justify-center bg-blue-50 bg-cover bg-no-repeat bg-center"
        style={{ backgroundImage: `url(${AUTH_IMG})` }}
      >
        <img src={UI_IMG} alt="" className="w-[80%] h-[80%  ] object-cover" />
      </div>
    </div>
  );
};

export default AuthLayout;
