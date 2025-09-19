import { prisma } from './prisma'

/**
 * Generates a new SKU by incrementing the counter value
 * Format: PREFIX-00001 (padded to 5 digits)
 */
export async function generateSKU(): Promise<string> {
  try {
    // Create or update counter in a single operation
    const counter = await prisma.counter.upsert({
      where: { id: 'sku_counter' },
      update: { value: { increment: 1 } },
      create: {
        id: 'sku_counter',
        name: 'SKU Counter',
        value: 1,
        prefix: 'SKU',
      },
    });
    
    // Format the SKU with the prefix and padded number
    const paddedNumber = counter.value.toString().padStart(5, '0');
    return `${counter.prefix}-${paddedNumber}`;
  } catch (error) {
    console.error('Error generating SKU:', error);
    // Fallback to a timestamp-based SKU if the counter fails
    const timestamp = Date.now().toString().slice(-5);
    return `SKU-${timestamp}`;
  }
}

/**
 * Updates the SKU counter prefix
 */
export async function updateSKUPrefix(newPrefix: string): Promise<void> {
  try {
    await prisma.counter.upsert({
      where: { id: 'sku_counter' },
      update: { prefix: newPrefix },
      create: {
        id: 'sku_counter',
        name: 'SKU Counter',
        value: 0,
        prefix: newPrefix,
      },
    });
  } catch (error) {
    console.error('Error updating SKU prefix:', error);
    throw error;
  }
}

/**
 * Gets the current counter value without incrementing
 */
export async function getCurrentCounterValue(): Promise<{ value: number; prefix: string }> {
  try {
    const counter = await prisma.counter.findUnique({
      where: { id: 'sku_counter' },
    });

    if (!counter) {
      return { value: 0, prefix: 'SKU' };
    }

    return { value: counter.value, prefix: counter.prefix };
  } catch (error) {
    console.error('Error getting counter value:', error);
    return { value: 0, prefix: 'SKU' };
  }
}

// ESM exports above