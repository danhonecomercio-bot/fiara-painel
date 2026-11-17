import { MemoryOfferRepository } from "./memory-repository";

const store = globalThis as {
  __fiaraDemoRepo?: MemoryOfferRepository;
};

export async function getDemoRepository() {
  store.__fiaraDemoRepo ??= new MemoryOfferRepository();
  return store.__fiaraDemoRepo;
}
