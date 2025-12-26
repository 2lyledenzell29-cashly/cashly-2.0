// Request manager to handle debouncing and deduplication
class RequestManager {
    private pendingRequests = new Map<string, Promise<any>>();
    private debounceTimers = new Map<string, NodeJS.Timeout>();

    // Debounce a function call
    debounce<T extends (...args: any[]) => Promise<any>>(
        key: string,
        fn: T,
        delay: number = 300
    ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
        return (...args: Parameters<T>): Promise<ReturnType<T>> => {
            return new Promise((resolve, reject) => {
                // Clear existing timer
                const existingTimer = this.debounceTimers.get(key);
                if (existingTimer) {
                    clearTimeout(existingTimer);
                }

                // Set new timer
                const timer = setTimeout(async () => {
                    try {
                        const result = await fn(...args);
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    } finally {
                        this.debounceTimers.delete(key);
                    }
                }, delay);

                this.debounceTimers.set(key, timer);
            });
        };
    }

    // Deduplicate identical requests
    deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
        // If request is already pending, return the existing promise
        if (this.pendingRequests.has(key)) {
            const existingPromise = this.pendingRequests.get(key);
            if (existingPromise) {
                return existingPromise as Promise<T>;
            }
        }

        // Create new request
        const promise = requestFn()
            .finally(() => {
                // Clean up when request completes
                this.pendingRequests.delete(key);
            });

        this.pendingRequests.set(key, promise);
        return promise;
    }

    // Combine debouncing and deduplication
    debouncedRequest<T>(
        key: string,
        requestFn: () => Promise<T>,
        delay: number = 300
    ): Promise<T> {
        // Check if request is already pending
        if (this.pendingRequests.has(key)) {
            const existingPromise = this.pendingRequests.get(key);
            if (existingPromise) {
                return existingPromise as Promise<T>;
            }
        }

        // Create debounced promise and store it
        const promise = new Promise<T>((resolve, reject) => {
            // Clear existing timer
            const existingTimer = this.debounceTimers.get(key);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }

            // Set new timer
            const timer = setTimeout(async () => {
                try {
                    const result = await requestFn();
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    this.debounceTimers.delete(key);
                    this.pendingRequests.delete(key);
                }
            }, delay);

            this.debounceTimers.set(key, timer);
        });

        this.pendingRequests.set(key, promise);
        return promise;
    }

    // Clear all pending requests and timers
    clear(): void {
        // Clear all timers
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();

        // Clear pending requests
        this.pendingRequests.clear();
    }
}

export const requestManager = new RequestManager();