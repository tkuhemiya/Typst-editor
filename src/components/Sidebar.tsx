import useUrl from "@/hooks/use-url";
import { useEffect, type Dispatch, type SetStateAction } from "react";

interface SidebarProps {}

const Sidebar = ({}: SidebarProps) => {
  const [urlParams, setUrl] = useUrl();

  useEffect(() => {}, []);

  return <div className="flex flex-col">{}</div>;
};

export default Sidebar;
