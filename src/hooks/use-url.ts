import { useState, useCallback, useEffect } from "react";

export default function useUrl(): [
  URLSearchParams,
  (key: string, value: string) => void,
] {
  const getParams = () => new URLSearchParams(window.location.search);
  const [searchParams, setSearchParams] = useState(getParams());

  const updateSearchParams = useCallback((key: string, value: string) => {
    const params = getParams();
    params.set(key, value);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, "", newUrl);

    window.dispatchEvent(new Event("setNewParams"));
  }, []);

  useEffect(() => {
    const handlePopState = () => setSearchParams(getParams());
    window.addEventListener("setNewParams", handlePopState);
    return () => window.removeEventListener("setNewParams", handlePopState);
  }, []);

  return [searchParams, updateSearchParams];
}
