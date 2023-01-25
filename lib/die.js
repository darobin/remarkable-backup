
import process from 'process';

export default function die (msg) {
  console.error(msg);
  process.exit(1);
}
