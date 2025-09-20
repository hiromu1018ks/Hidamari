// テスト用の簡単なコード
const message = "Hello, Backend!";

function greet(name: string): string {
  return `${message} Welcome, ${name}!`;
}

console.log(greet("World"));

export { greet };
