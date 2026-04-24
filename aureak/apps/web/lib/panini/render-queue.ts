// Story 105.1 — Queue de rendu max 3 en parallèle pour éviter UI jank

type Job<T> = () => Promise<T>

const MAX_PARALLEL = 3
let running = 0

type QueuedJob = {
  job    : Job<unknown>
  resolve: (v: unknown) => void
  reject : (e: unknown) => void
}

const queue: QueuedJob[] = []

function pump() {
  while (running < MAX_PARALLEL && queue.length > 0) {
    const { job, resolve, reject } = queue.shift()!
    running++
    job()
      .then(resolve, reject)
      .finally(() => {
        running--
        pump()
      })
  }
}

export function enqueueRender<T>(job: Job<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push({
      job    : job as Job<unknown>,
      resolve: resolve as (v: unknown) => void,
      reject,
    })
    pump()
  })
}
