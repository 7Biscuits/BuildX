import HomePage from "@/pages/HomePage";
import ScrollToHash from "@/components/ScrollToHash";
import { Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  );
}
