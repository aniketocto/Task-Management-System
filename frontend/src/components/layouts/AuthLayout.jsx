import LOGO from "../../assets/logo-png.png";
import CRM_VIDEO from "../../assets/crm-video.mp4";

const AuthLayout = ({ children }) => {
  return (
    <div className="flex">
      <div className="w-screen h-screen md:w-[55vw] px-12 pt-8 pb-12 relative z-10">
        <img src={LOGO} alt="Unstoppable" className="w-40" />
        {children}
      </div>

      <div className="hidden md:flex w-[45vw] h-screen items-center justify-center relative overflow-hidden">
        <video
          className="absolute top-0 left-0 w-full h-full object-cover"
          src={CRM_VIDEO}
          autoPlay
          loop
          muted
          playsInline
        />
        {/* Optional: Overlay (if you want a semi-transparent tint) */}
        <div className="absolute inset-0 bg-black/30 z-1" />
      </div>
    </div>
  );
};

export default AuthLayout;
