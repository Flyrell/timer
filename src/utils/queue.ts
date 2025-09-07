export class Queue<T> {
    private items = new Set<T>();

    constructor(private readonly maxSize: number) {}

    add(item: T): void {
        this.items.add(item);

        if (this.items.size > this.maxSize) {
            this.dequeue();
        }
    }

    dequeue(): T | undefined {
        const first = this.items.values().next().value;
        if (first) {
            this.items.delete(first);
        }
        return first;
    }

    iterate(): IterableIterator<T> {
        return this.items.values();
    }
}
