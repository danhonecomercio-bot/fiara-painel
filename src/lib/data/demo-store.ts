import { seedExampleOffers } from "../offers/examples";
import { MemoryOfferRepository } from "./memory-repository";

const store = globalThis as {
  __fiaraDemoRepo?: MemoryOfferRepository;
  __fiaraDemoReady?: Promise<void>;
};

export async function getDemoRepository() {
  if (!store.__fiaraDemoReady || !store.__fiaraDemoRepo) {
    const repo = new MemoryOfferRepository();
    store.__fiaraDemoRepo = repo;
    store.__fiaraDemoReady = seedExampleOffers(repo);
  }
  await store.__fiaraDemoReady;
  return store.__fiaraDemoRepo;
}
