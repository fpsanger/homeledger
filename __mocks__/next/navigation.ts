export const useRouter = () => ({ push: jest.fn(), refresh: jest.fn() });
export const useSearchParams = () => new URLSearchParams();
export const usePathname = () => "/";
