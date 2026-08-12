/** Display formatting shared across components. Extracted because five
 *  components carried byte-identical copies of titleize. */

export const money = (n) => `💰 ${Math.round(n).toLocaleString()}`;

export const titleize = (s) => s.replace(/_/g, ' ');
