import { type CodeSnippet, SNIPPETS } from './snippets';

/**
 * A code snippet for a specific feature in a specific language.
 * Extends the base CodeSnippet interface from snippets.ts.
 */
export interface FeatureCodeSnippet extends CodeSnippet {
  /** Shiki language identifier for syntax highlighting */
  lang: string;
  /** Short description of what the snippet demonstrates */
  label: string;
  /** The actual source code (5-12 lines) */
  code: string;
}

/**
 * A code feature with comparison snippets across all supported languages.
 */
export interface CodeFeature {
  /** Feature name displayed in tabs and matrix */
  name: string;
  /** One-sentence description of the feature */
  description: string;
  /** Snippets keyed by language ID; undefined if language lacks native support */
  snippets: Record<string, FeatureCodeSnippet | undefined>;
}

// ─── All 25 language IDs ──────────────────────────────────────────────────────
const ALL_LANGS = [
  'haskell', 'rust', 'elixir', 'kotlin', 'swift', 'python', 'ruby',
  'typescript', 'scala', 'clojure', 'fsharp', 'ocaml', 'go', 'csharp',
  'dart', 'julia', 'lua', 'zig', 'java', 'javascript', 'c', 'cpp',
  'php', 'perl', 'cobol',
] as const;

// ─── Feature 1: Variable Declaration ──────────────────────────────────────────
const variableDeclaration: CodeFeature = {
  name: 'Variable Declaration',
  description: 'Basic variable syntax, type annotations, and initialization patterns.',
  snippets: {
    haskell: {
      lang: 'haskell',
      label: 'Let binding with type signature',
      code: `greeting :: String
greeting = "Hello, World!"

add :: Int -> Int -> Int
add x y = x + y

result :: Int
result = add 3 7`,
    },
    rust: {
      lang: 'rust',
      label: 'Let bindings with mutability',
      code: `let name = "Rust";
let mut count: i32 = 0;
let (x, y) = (10, 20);

count += 1;

const MAX_SIZE: usize = 1024;
let inferred = vec![1, 2, 3];`,
    },
    elixir: {
      lang: 'elixir',
      label: 'Pattern matching assignment',
      code: `name = "Elixir"
age = 12
{status, message} = {:ok, "Connected"}

[head | tail] = [1, 2, 3, 4]
%{name: lang} = %{name: "Elixir", year: 2011}`,
    },
    kotlin: {
      lang: 'kotlin',
      label: 'Val/var with type inference',
      code: `val name = "Kotlin"
var count: Int = 0
val languages = listOf("Kotlin", "Java", "Scala")

count += 1

val (x, y) = Pair(10, 20)
val nullable: String? = null`,
    },
    swift: {
      lang: 'swift',
      label: 'Let/var with optionals',
      code: `let name = "Swift"
var count: Int = 0
let languages = ["Swift", "Objective-C"]

count += 1

let optional: String? = nil
let (x, y) = (10, 20)`,
    },
    python: {
      lang: 'python',
      label: 'Dynamic typing with type hints',
      code: `name = "Python"
count: int = 0
languages: list[str] = ["Python", "Ruby"]

x, y = 10, 20
count += 1

PI: float = 3.14159`,
    },
    ruby: {
      lang: 'ruby',
      label: 'Dynamic variables and constants',
      code: `name = "Ruby"
count = 0
languages = ["Ruby", "Python"]

x, y = 10, 20
count += 1

MAX_SIZE = 1024
@instance_var = "hello"`,
    },
    typescript: {
      lang: 'typescript',
      label: 'Const/let with type annotations',
      code: `const name: string = "TypeScript";
let count = 0;
const languages: string[] = ["TS", "JS"];

count += 1;

const [x, y] = [10, 20];
const { age, ...rest } = { age: 30, name: "TS" };`,
    },
    scala: {
      lang: 'scala',
      label: 'Val/var with type inference',
      code: `val name = "Scala"
var count: Int = 0
val languages = List("Scala", "Java")

count += 1

val (x, y) = (10, 20)
lazy val expensive = computeResult()`,
    },
    clojure: {
      lang: 'clojure',
      label: 'Def and let bindings',
      code: `(def name "Clojure")
(def languages ["Clojure" "Java"])

(let [count 0
      x 10
      y 20
      total (+ x y)]
  (println name total))`,
    },
    fsharp: {
      lang: 'fsharp',
      label: 'Let bindings with inference',
      code: `let name = "F#"
let mutable count = 0
let languages = ["F#"; "C#"; "OCaml"]

count <- count + 1

let x, y = 10, 20
let pi : float = 3.14159`,
    },
    ocaml: {
      lang: 'ocaml',
      label: 'Let bindings with type annotation',
      code: `let name = "OCaml"
let count = ref 0
let languages = ["OCaml"; "Haskell"]

let () = count := !count + 1

let x, y = 10, 20
let (pi : float) = 3.14159`,
    },
    go: {
      lang: 'go',
      label: 'Short and long declarations',
      code: `name := "Go"
var count int = 0
languages := []string{"Go", "C"}

count++

var (
    x = 10
    y = 20
)
const MaxSize = 1024`,
    },
    csharp: {
      lang: 'csharp',
      label: 'Var inference and explicit types',
      code: `var name = "C#";
int count = 0;
var languages = new List<string> { "C#", "F#" };

count++;

var (x, y) = (10, 20);
const int MaxSize = 1024;`,
    },
    dart: {
      lang: 'dart',
      label: 'Final/var/const declarations',
      code: `final name = 'Dart';
var count = 0;
final languages = <String>['Dart', 'Flutter'];

count++;

const maxSize = 1024;
String? nullable;
late final String deferred;`,
    },
    julia: {
      lang: 'julia',
      label: 'Dynamic with optional annotations',
      code: `name = "Julia"
count::Int = 0
languages = ["Julia", "Python"]

count += 1

x, y = 10, 20
const MAX_SIZE = 1024`,
    },
    lua: {
      lang: 'lua',
      label: 'Local and global variables',
      code: `local name = "Lua"
local count = 0
local languages = {"Lua", "C"}

count = count + 1

local x, y = 10, 20
-- No constants in Lua`,
    },
    zig: {
      lang: 'zig',
      label: 'Const and var declarations',
      code: `const name = "Zig";
var count: i32 = 0;
const languages = [_][]const u8{ "Zig", "C" };

count += 1;

const x: u32 = 10;
comptime var y: u32 = 20;`,
    },
    java: {
      lang: 'java',
      label: 'Explicit types and var inference',
      code: `String name = "Java";
int count = 0;
var languages = List.of("Java", "Kotlin");

count++;

final int MAX_SIZE = 1024;
var x = 10;
var y = 20;`,
    },
    javascript: {
      lang: 'javascript',
      label: 'Const/let/var declarations',
      code: `const name = "JavaScript";
let count = 0;
const languages = ["JS", "TS"];

count++;

const [x, y] = [10, 20];
const { age, ...rest } = { age: 30, name: "JS" };`,
    },
    c: {
      lang: 'c',
      label: 'Explicit type declarations',
      code: `char *name = "C";
int count = 0;
const char *languages[] = {"C", "C++"};

count++;

int x = 10, y = 20;
#define MAX_SIZE 1024`,
    },
    cpp: {
      lang: 'cpp',
      label: 'Auto inference and references',
      code: `auto name = std::string("C++");
int count = 0;
auto languages = std::vector<std::string>{"C++", "C"};

count++;

auto [x, y] = std::pair(10, 20);
constexpr int MAX_SIZE = 1024;`,
    },
    php: {
      lang: 'php',
      label: 'Dynamic with type declarations',
      code: `$name = 'PHP';
$count = 0;
$languages = ['PHP', 'Python'];

$count++;

[$x, $y] = [10, 20];
define('MAX_SIZE', 1024);
const VERSION = '8.3';`,
    },
    perl: {
      lang: 'perl',
      label: 'Sigil-based declarations',
      code: `my $name = 'Perl';
my $count = 0;
my @languages = ('Perl', 'Ruby');

$count++;

my ($x, $y) = (10, 20);
my %config = (max => 1024, min => 0);
use constant PI => 3.14159;`,
    },
    cobol: {
      lang: 'cobol',
      label: 'Working storage section',
      code: `DATA DIVISION.
WORKING-STORAGE SECTION.
01  WS-NAME      PIC X(20) VALUE "COBOL".
01  WS-COUNT     PIC 9(4)  VALUE ZERO.
01  WS-LANGS.
    05  WS-LANG-1 PIC X(10) VALUE "COBOL".
    05  WS-LANG-2 PIC X(10) VALUE "FORTRAN".
01  WS-X         PIC 9(4)  VALUE 10.
01  WS-Y         PIC 9(4)  VALUE 20.`,
    },
  },
};

// ─── Feature 2: If/Else ──────────────────────────────────────────────────────
const ifElse: CodeFeature = {
  name: 'If/Else',
  description: 'Conditional branching and control flow expressions.',
  snippets: {
    haskell: {
      lang: 'haskell',
      label: 'Guards and if expression',
      code: `classify :: Int -> String
classify n
  | n < 0     = "negative"
  | n == 0    = "zero"
  | n < 100   = "small"
  | otherwise = "large"`,
    },
    rust: {
      lang: 'rust',
      label: 'If as expression',
      code: `let label = if score >= 90 {
    "excellent"
} else if score >= 70 {
    "good"
} else if score >= 50 {
    "average"
} else {
    "needs improvement"
};`,
    },
    elixir: {
      lang: 'elixir',
      label: 'Cond and if/else',
      code: `cond do
  score >= 90 -> "excellent"
  score >= 70 -> "good"
  score >= 50 -> "average"
  true        -> "needs improvement"
end`,
    },
    kotlin: {
      lang: 'kotlin',
      label: 'When expression',
      code: `val label = when {
    score >= 90 -> "excellent"
    score >= 70 -> "good"
    score >= 50 -> "average"
    else -> "needs improvement"
}`,
    },
    swift: {
      lang: 'swift',
      label: 'If/else with binding',
      code: `let label: String
if score >= 90 {
    label = "excellent"
} else if score >= 70 {
    label = "good"
} else if score >= 50 {
    label = "average"
} else {
    label = "needs improvement"
}`,
    },
    python: {
      lang: 'python',
      label: 'If/elif/else chain',
      code: `if score >= 90:
    label = "excellent"
elif score >= 70:
    label = "good"
elif score >= 50:
    label = "average"
else:
    label = "needs improvement"`,
    },
    ruby: {
      lang: 'ruby',
      label: 'If/elsif and ternary',
      code: `label = if score >= 90
          "excellent"
        elsif score >= 70
          "good"
        elsif score >= 50
          "average"
        else
          "needs improvement"
        end`,
    },
    typescript: {
      lang: 'typescript',
      label: 'If/else with type narrowing',
      code: `function describe(value: string | number): string {
  if (typeof value === "number") {
    return value > 0 ? "positive" : "non-positive";
  } else {
    return value.length > 0 ? "non-empty" : "empty";
  }
}`,
    },
    scala: {
      lang: 'scala',
      label: 'If as expression',
      code: `val label =
  if score >= 90 then "excellent"
  else if score >= 70 then "good"
  else if score >= 50 then "average"
  else "needs improvement"`,
    },
    clojure: {
      lang: 'clojure',
      label: 'Cond expression',
      code: `(cond
  (>= score 90) "excellent"
  (>= score 70) "good"
  (>= score 50) "average"
  :else         "needs improvement")`,
    },
    fsharp: {
      lang: 'fsharp',
      label: 'If/elif expression',
      code: `let label =
    if score >= 90 then "excellent"
    elif score >= 70 then "good"
    elif score >= 50 then "average"
    else "needs improvement"`,
    },
    ocaml: {
      lang: 'ocaml',
      label: 'If/then/else expression',
      code: `let label =
  if score >= 90 then "excellent"
  else if score >= 70 then "good"
  else if score >= 50 then "average"
  else "needs improvement"`,
    },
    go: {
      lang: 'go',
      label: 'If with init statement',
      code: `var label string
if score >= 90 {
    label = "excellent"
} else if score >= 70 {
    label = "good"
} else if score >= 50 {
    label = "average"
} else {
    label = "needs improvement"
}`,
    },
    csharp: {
      lang: 'csharp',
      label: 'Switch expression',
      code: `var label = score switch
{
    >= 90 => "excellent",
    >= 70 => "good",
    >= 50 => "average",
    _     => "needs improvement"
};`,
    },
    dart: {
      lang: 'dart',
      label: 'If/else with null check',
      code: `String classify(int? score) {
  if (score == null) return 'unknown';
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'average';
  return 'needs improvement';
}`,
    },
    julia: {
      lang: 'julia',
      label: 'If/elseif/end',
      code: `label = if score >= 90
    "excellent"
elseif score >= 70
    "good"
elseif score >= 50
    "average"
else
    "needs improvement"
end`,
    },
    lua: {
      lang: 'lua',
      label: 'If/elseif/end',
      code: `local label
if score >= 90 then
    label = "excellent"
elseif score >= 70 then
    label = "good"
elseif score >= 50 then
    label = "average"
else
    label = "needs improvement"
end`,
    },
    zig: {
      lang: 'zig',
      label: 'If/else with captures',
      code: `const label = if (score >= 90)
    "excellent"
else if (score >= 70)
    "good"
else if (score >= 50)
    "average"
else
    "needs improvement";`,
    },
    java: {
      lang: 'java',
      label: 'If/else chain',
      code: `String label;
if (score >= 90) {
    label = "excellent";
} else if (score >= 70) {
    label = "good";
} else if (score >= 50) {
    label = "average";
} else {
    label = "needs improvement";
}`,
    },
    javascript: {
      lang: 'javascript',
      label: 'Ternary and if/else',
      code: `const label = score >= 90 ? "excellent"
  : score >= 70 ? "good"
  : score >= 50 ? "average"
  : "needs improvement";`,
    },
    c: {
      lang: 'c',
      label: 'If/else chain',
      code: `const char *label;
if (score >= 90) {
    label = "excellent";
} else if (score >= 70) {
    label = "good";
} else if (score >= 50) {
    label = "average";
} else {
    label = "needs improvement";
}`,
    },
    cpp: {
      lang: 'cpp',
      label: 'If with initializer',
      code: `std::string classify(int score) {
    if (score >= 90) return "excellent";
    else if (score >= 70) return "good";
    else if (score >= 50) return "average";
    else return "needs improvement";
}`,
    },
    php: {
      lang: 'php',
      label: 'Match expression',
      code: `$label = match(true) {
    $score >= 90 => 'excellent',
    $score >= 70 => 'good',
    $score >= 50 => 'average',
    default      => 'needs improvement',
};`,
    },
    perl: {
      lang: 'perl',
      label: 'If/elsif/else',
      code: `my $label;
if ($score >= 90) {
    $label = "excellent";
} elsif ($score >= 70) {
    $label = "good";
} elsif ($score >= 50) {
    $label = "average";
} else {
    $label = "needs improvement";
}`,
    },
    cobol: {
      lang: 'cobol',
      label: 'Evaluate statement',
      code: `EVALUATE TRUE
    WHEN WS-SCORE >= 90
        MOVE "EXCELLENT" TO WS-LABEL
    WHEN WS-SCORE >= 70
        MOVE "GOOD" TO WS-LABEL
    WHEN WS-SCORE >= 50
        MOVE "AVERAGE" TO WS-LABEL
    WHEN OTHER
        MOVE "NEEDS IMPROVEMENT" TO WS-LABEL
END-EVALUATE.`,
    },
  },
};

// ─── Feature 3: Loops ─────────────────────────────────────────────────────────
const loops: CodeFeature = {
  name: 'Loops',
  description: 'For/while iteration patterns and loop constructs.',
  snippets: {
    haskell: {
      lang: 'haskell',
      label: 'Recursion and list comprehension',
      code: `-- Haskell uses recursion, not loops
factorial :: Integer -> Integer
factorial 0 = 1
factorial n = n * factorial (n - 1)

evens :: [Int] -> [Int]
evens xs = [x | x <- xs, even x]`,
    },
    rust: {
      lang: 'rust',
      label: 'For, while, and loop',
      code: `for i in 0..10 {
    println!("{}", i);
}

let mut sum = 0;
let mut n = 1;
while n <= 100 {
    sum += n;
    n += 1;
}`,
    },
    elixir: {
      lang: 'elixir',
      label: 'Enum and recursion',
      code: `Enum.each(1..10, fn i ->
  IO.puts(i)
end)

for x <- 1..10, rem(x, 2) == 0, do: x * x

defp sum_to(0), do: 0
defp sum_to(n), do: n + sum_to(n - 1)`,
    },
    kotlin: {
      lang: 'kotlin',
      label: 'For and ranges',
      code: `for (i in 1..10) {
    println(i)
}

for ((index, value) in list.withIndex()) {
    println("$index: $value")
}

var sum = 0
while (sum < 100) { sum += 10 }`,
    },
    swift: {
      lang: 'swift',
      label: 'For-in and stride',
      code: `for i in 1...10 {
    print(i)
}

for (index, value) in list.enumerated() {
    print("\\(index): \\(value)")
}

for i in stride(from: 0, to: 100, by: 5) {
    print(i)
}`,
    },
    python: {
      lang: 'python',
      label: 'For and while with enumerate',
      code: `for i in range(10):
    print(i)

for index, value in enumerate(items):
    print(f"{index}: {value}")

total = 0
while total < 100:
    total += 10`,
    },
    ruby: {
      lang: 'ruby',
      label: 'Each, times, and upto',
      code: `10.times { |i| puts i }

items.each_with_index do |item, i|
  puts "#{i}: #{item}"
end

total = 0
total += 10 while total < 100`,
    },
    typescript: {
      lang: 'typescript',
      label: 'For-of and forEach',
      code: `for (const item of items) {
  console.log(item);
}

items.forEach((item, index) => {
  console.log(\`\${index}: \${item}\`);
});

for (let i = 0; i < 10; i++) {
  console.log(i);
}`,
    },
    scala: {
      lang: 'scala',
      label: 'For-comprehension loop',
      code: `for i <- 1 to 10 do
  println(i)

for
  (index, value) <- list.zipWithIndex
do println(s"$index: $value")

var sum = 0
while sum < 100 do sum += 10`,
    },
    clojure: {
      lang: 'clojure',
      label: 'Doseq and loop/recur',
      code: `(doseq [i (range 10)]
  (println i))

(loop [sum 0 n 1]
  (if (> n 100)
    sum
    (recur (+ sum n) (inc n))))`,
    },
    fsharp: {
      lang: 'fsharp',
      label: 'For and sequence expressions',
      code: `for i in 1 .. 10 do
    printfn "%d" i

for index, value in List.indexed items do
    printfn "%d: %A" index value

let mutable total = 0
while total < 100 do
    total <- total + 10`,
    },
    ocaml: {
      lang: 'ocaml',
      label: 'For and recursive loop',
      code: `for i = 0 to 9 do
  Printf.printf "%d\\n" i
done

let rec sum_to n =
  if n <= 0 then 0
  else n + sum_to (n - 1)`,
    },
    go: {
      lang: 'go',
      label: 'For as the only loop',
      code: `for i := 0; i < 10; i++ {
    fmt.Println(i)
}

for index, value := range items {
    fmt.Printf("%d: %s\\n", index, value)
}

sum := 0
for sum < 100 {
    sum += 10
}`,
    },
    csharp: {
      lang: 'csharp',
      label: 'Foreach and LINQ',
      code: `foreach (var item in items)
{
    Console.WriteLine(item);
}

for (var i = 0; i < 10; i++)
{
    Console.WriteLine(i);
}

var sum = 0;
while (sum < 100) sum += 10;`,
    },
    dart: {
      lang: 'dart',
      label: 'For-in and classic for',
      code: `for (final item in items) {
  print(item);
}

for (var i = 0; i < 10; i++) {
  print(i);
}

var sum = 0;
while (sum < 100) { sum += 10; }`,
    },
    julia: {
      lang: 'julia',
      label: 'For with ranges',
      code: `for i in 1:10
    println(i)
end

for (i, val) in enumerate(items)
    println("$i: $val")
end

total = 0
while total < 100
    total += 10
end`,
    },
    lua: {
      lang: 'lua',
      label: 'Numeric and generic for',
      code: `for i = 1, 10 do
    print(i)
end

for index, value in ipairs(items) do
    print(index .. ": " .. value)
end

local total = 0
while total < 100 do
    total = total + 10
end`,
    },
    zig: {
      lang: 'zig',
      label: 'For and while loops',
      code: `for (items) |item, index| {
    std.debug.print("{}: {s}\\n", .{ index, item });
}

var sum: u32 = 0;
var i: u32 = 0;
while (i < 10) : (i += 1) {
    sum += i;
}`,
    },
    java: {
      lang: 'java',
      label: 'Enhanced for and streams',
      code: `for (var item : items) {
    System.out.println(item);
}

for (int i = 0; i < 10; i++) {
    System.out.println(i);
}

int sum = 0;
while (sum < 100) { sum += 10; }`,
    },
    javascript: {
      lang: 'javascript',
      label: 'For-of and forEach',
      code: `for (const item of items) {
  console.log(item);
}

items.forEach((item, index) => {
  console.log(\`\${index}: \${item}\`);
});

for (let i = 0; i < 10; i++) {
  console.log(i);
}`,
    },
    c: {
      lang: 'c',
      label: 'For and while loops',
      code: `for (int i = 0; i < 10; i++) {
    printf("%d\\n", i);
}

int sum = 0;
while (sum < 100) {
    sum += 10;
}

do {
    process();
} while (has_more());`,
    },
    cpp: {
      lang: 'cpp',
      label: 'Range-based for',
      code: `for (const auto& item : items) {
    std::cout << item << "\\n";
}

for (int i = 0; i < 10; ++i) {
    std::cout << i << "\\n";
}

auto sum = 0;
while (sum < 100) { sum += 10; }`,
    },
    php: {
      lang: 'php',
      label: 'Foreach and for loops',
      code: `foreach ($items as $index => $item) {
    echo "$index: $item\\n";
}

for ($i = 0; $i < 10; $i++) {
    echo "$i\\n";
}

$sum = 0;
while ($sum < 100) { $sum += 10; }`,
    },
    perl: {
      lang: 'perl',
      label: 'For and foreach',
      code: `for my $i (0..9) {
    say $i;
}

foreach my $item (@items) {
    say $item;
}

my $sum = 0;
$sum += 10 while $sum < 100;`,
    },
    cobol: {
      lang: 'cobol',
      label: 'Perform varying',
      code: `PERFORM VARYING WS-I FROM 1 BY 1
    UNTIL WS-I > 10
    DISPLAY WS-I
END-PERFORM.

PERFORM UNTIL WS-SUM >= 100
    ADD 10 TO WS-SUM
END-PERFORM.`,
    },
  },
};

// ─── Feature 4: Functions ─────────────────────────────────────────────────────
const functions: CodeFeature = {
  name: 'Functions',
  description: 'Function definition, parameters, return types, and closures.',
  snippets: {
    haskell: {
      lang: 'haskell',
      label: 'Pure functions with signatures',
      code: `greet :: String -> String
greet name = "Hello, " ++ name ++ "!"

apply :: (a -> b) -> a -> b
apply f x = f x

compose :: (b -> c) -> (a -> b) -> a -> c
compose f g x = f (g x)`,
    },
    rust: {
      lang: 'rust',
      label: 'Functions and closures',
      code: `fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn apply<F, T, R>(f: F, x: T) -> R
where F: Fn(T) -> R {
    f(x)
}

let double = |x: i32| x * 2;`,
    },
    elixir: {
      lang: 'elixir',
      label: 'Def and anonymous functions',
      code: `def greet(name) do
  "Hello, #{name}!"
end

defp validate(input) when is_binary(input) do
  {:ok, input}
end

square = fn x -> x * x end
apply = &(&1 + &2)`,
    },
    kotlin: {
      lang: 'kotlin',
      label: 'Fun and lambdas',
      code: `fun greet(name: String): String =
    "Hello, $name!"

fun <T, R> apply(value: T, f: (T) -> R): R =
    f(value)

val double = { x: Int -> x * 2 }
val sum = listOf(1, 2, 3).fold(0) { acc, n -> acc + n }`,
    },
    swift: {
      lang: 'swift',
      label: 'Func and closures',
      code: `func greet(_ name: String) -> String {
    "Hello, \\(name)!"
}

func apply<T, R>(_ f: (T) -> R, to value: T) -> R {
    f(value)
}

let double = { (x: Int) in x * 2 }`,
    },
    python: {
      lang: 'python',
      label: 'Def and lambda',
      code: `def greet(name: str) -> str:
    return f"Hello, {name}!"

def apply(f, x):
    return f(x)

double = lambda x: x * 2

def make_adder(n):
    return lambda x: x + n`,
    },
    ruby: {
      lang: 'ruby',
      label: 'Methods and blocks',
      code: `def greet(name)
  "Hello, #{name}!"
end

def apply(value, &block)
  block.call(value)
end

double = ->(x) { x * 2 }
triple = proc { |x| x * 3 }`,
    },
    typescript: {
      lang: 'typescript',
      label: 'Arrow functions and generics',
      code: `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const apply = <T, R>(f: (x: T) => R, x: T): R => f(x);

const double = (x: number) => x * 2;
const pipe = <T>(...fns: ((x: T) => T)[]) =>
  (x: T) => fns.reduce((v, f) => f(v), x);`,
    },
    scala: {
      lang: 'scala',
      label: 'Def and function literals',
      code: `def greet(name: String): String =
  s"Hello, $name!"

def apply[T, R](f: T => R)(x: T): R = f(x)

val double = (x: Int) => x * 2
val add: (Int, Int) => Int = _ + _`,
    },
    clojure: {
      lang: 'clojure',
      label: 'Defn and anonymous functions',
      code: `(defn greet [name]
  (str "Hello, " name "!"))

(defn apply-fn [f x]
  (f x))

(def double #(* % 2))
(def add (fn [a b] (+ a b)))`,
    },
    fsharp: {
      lang: 'fsharp',
      label: 'Let-bound functions and lambdas',
      code: `let greet name = sprintf "Hello, %s!" name

let apply f x = f x

let double = fun x -> x * 2
let add a b = a + b
let composed = greet >> String.length`,
    },
    ocaml: {
      lang: 'ocaml',
      label: 'Let-bound and anonymous functions',
      code: `let greet name = Printf.sprintf "Hello, %s!" name

let apply f x = f x

let double = fun x -> x * 2
let add a b = a + b
let composed = Fun.compose String.length greet`,
    },
    go: {
      lang: 'go',
      label: 'Functions and closures',
      code: `func greet(name string) string {
    return fmt.Sprintf("Hello, %s!", name)
}

func apply(f func(int) int, x int) int {
    return f(x)
}

double := func(x int) int { return x * 2 }`,
    },
    csharp: {
      lang: 'csharp',
      label: 'Methods and lambdas',
      code: `string Greet(string name) => $"Hello, {name}!";

T Apply<T>(Func<T, T> f, T x) => f(x);

Func<int, int> doubler = x => x * 2;
var sum = numbers.Aggregate(0, (acc, n) => acc + n);`,
    },
    dart: {
      lang: 'dart',
      label: 'Functions and arrow syntax',
      code: `String greet(String name) => 'Hello, $name!';

T apply<T>(T Function(T) f, T x) => f(x);

final double = (int x) => x * 2;

void forEach<T>(List<T> items, void Function(T) action) {
  for (final item in items) action(item);
}`,
    },
    julia: {
      lang: 'julia',
      label: 'Function and anonymous forms',
      code: `function greet(name::String)::String
    "Hello, $name!"
end

greet(name) = "Hello, $name!"

double = x -> x * 2
apply(f, x) = f(x)`,
    },
    lua: {
      lang: 'lua',
      label: 'Functions and closures',
      code: `function greet(name)
  return "Hello, " .. name .. "!"
end

local apply = function(f, x)
  return f(x)
end

local double = function(x) return x * 2 end`,
    },
    zig: {
      lang: 'zig',
      label: 'Functions with comptime',
      code: `fn greet(name: []const u8) void {
    std.debug.print("Hello, {s}!\\n", .{name});
}

fn apply(comptime T: type, f: fn (T) T, x: T) T {
    return f(x);
}`,
    },
    java: {
      lang: 'java',
      label: 'Methods and lambdas',
      code: `String greet(String name) {
    return "Hello, " + name + "!";
}

<T, R> R apply(Function<T, R> f, T x) {
    return f.apply(x);
}

Function<Integer, Integer> doubler = x -> x * 2;`,
    },
    javascript: {
      lang: 'javascript',
      label: 'Arrow functions and closures',
      code: `function greet(name) {
  return \`Hello, \${name}!\`;
}

const apply = (f, x) => f(x);

const double = x => x * 2;
const makeAdder = n => x => x + n;`,
    },
    c: {
      lang: 'c',
      label: 'Functions and pointers',
      code: `char* greet(const char *name) {
    static char buf[64];
    snprintf(buf, sizeof(buf), "Hello, %s!", name);
    return buf;
}

int apply(int (*f)(int), int x) {
    return f(x);
}`,
    },
    cpp: {
      lang: 'cpp',
      label: 'Functions and std::function',
      code: `std::string greet(std::string_view name) {
    return std::format("Hello, {}!", name);
}

template<typename F, typename T>
auto apply(F f, T x) { return f(x); }

auto doubler = [](int x) { return x * 2; };`,
    },
    php: {
      lang: 'php',
      label: 'Functions and closures',
      code: `function greet(string $name): string {
    return "Hello, $name!";
}

$apply = fn($f, $x) => $f($x);
$double = fn($x) => $x * 2;

$makeAdder = fn($n) => fn($x) => $x + $n;`,
    },
    perl: {
      lang: 'perl',
      label: 'Sub and anonymous subs',
      code: `sub greet {
    my ($name) = @_;
    return "Hello, $name!";
}

my $double = sub { $_[0] * 2 };
my $apply = sub { $_[0]->($_[1]) };

sub make_adder {
    my ($n) = @_;
    return sub { $_[0] + $n };
}`,
    },
    cobol: {
      lang: 'cobol',
      label: 'Paragraphs and sections',
      code: `PROCEDURE DIVISION.
MAIN-LOGIC.
    PERFORM GREET-USER.
    PERFORM CALCULATE-TOTAL.
    STOP RUN.

GREET-USER.
    DISPLAY "Hello, " WS-NAME "!".

CALCULATE-TOTAL.
    ADD WS-PRICE TO WS-TOTAL.`,
    },
  },
};

// ─── Feature 5: Structs ──────────────────────────────────────────────────────
const structs: CodeFeature = {
  name: 'Structs',
  description: 'Data structure definition using classes, structs, records, or equivalent.',
  snippets: {
    haskell: {
      lang: 'haskell',
      label: 'Record syntax',
      code: `data User = User
  { userName  :: String
  , userEmail :: String
  , userAge   :: Int
  } deriving (Show, Eq)

data Shape
  = Circle Double
  | Rectangle Double Double`,
    },
    rust: {
      lang: 'rust',
      label: 'Struct with impl block',
      code: `#[derive(Debug, Clone)]
struct User {
    name: String,
    email: String,
    age: u32,
}

impl User {
    fn new(name: &str, email: &str, age: u32) -> Self {
        Self { name: name.into(), email: email.into(), age }
    }
}`,
    },
    elixir: {
      lang: 'elixir',
      label: 'Defstruct',
      code: `defmodule User do
  defstruct [:name, :email, age: 0]

  def new(name, email, age) do
    %User{name: name, email: email, age: age}
  end

  def greeting(%User{name: name}) do
    "Hello, #{name}!"
  end
end`,
    },
    kotlin: {
      lang: 'kotlin',
      label: 'Data class',
      code: `data class User(
    val name: String,
    val email: String,
    val age: Int
) {
    fun greeting(): String = "Hello, $name!"
}

val user = User("Alice", "alice@ex.com", 30)
val updated = user.copy(age = 31)`,
    },
    swift: {
      lang: 'swift',
      label: 'Struct with protocol conformance',
      code: `struct User: Codable, Equatable {
    let name: String
    let email: String
    var age: Int

    func greeting() -> String {
        "Hello, \\(name)!"
    }
}

let user = User(name: "Alice", email: "a@b.c", age: 30)`,
    },
    python: {
      lang: 'python',
      label: 'Dataclass',
      code: `from dataclasses import dataclass

@dataclass
class User:
    name: str
    email: str
    age: int = 0

    def greeting(self) -> str:
        return f"Hello, {self.name}!"`,
    },
    ruby: {
      lang: 'ruby',
      label: 'Struct and class',
      code: `User = Struct.new(:name, :email, :age) do
  def greeting
    "Hello, #{name}!"
  end
end

user = User.new("Alice", "alice@ex.com", 30)
puts user.greeting`,
    },
    typescript: {
      lang: 'typescript',
      label: 'Interface and class',
      code: `interface User {
  readonly name: string;
  readonly email: string;
  age: number;
}

class UserImpl implements User {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public age: number
  ) {}

  greeting(): string { return \`Hello, \${this.name}!\`; }
}`,
    },
    scala: {
      lang: 'scala',
      label: 'Case class',
      code: `case class User(
    name: String,
    email: String,
    age: Int = 0
):
  def greeting: String = s"Hello, $name!"

val user = User("Alice", "alice@ex.com", 30)
val updated = user.copy(age = 31)`,
    },
    clojure: {
      lang: 'clojure',
      label: 'Defrecord',
      code: `(defrecord User [name email age])

(defprotocol Greetable
  (greeting [this]))

(extend-type User
  Greetable
  (greeting [this]
    (str "Hello, " (:name this) "!")))

(def user (->User "Alice" "alice@ex.com" 30))`,
    },
    fsharp: {
      lang: 'fsharp',
      label: 'Record type',
      code: `type User =
    { Name: string
      Email: string
      Age: int }
    member this.Greeting = sprintf "Hello, %s!" this.Name

let user = { Name = "Alice"; Email = "a@b.c"; Age = 30 }
let updated = { user with Age = 31 }`,
    },
    ocaml: {
      lang: 'ocaml',
      label: 'Record type',
      code: `type user = {
  name : string;
  email : string;
  age : int;
}

let greeting u = Printf.sprintf "Hello, %s!" u.name

let user = { name = "Alice"; email = "a@b.c"; age = 30 }
let updated = { user with age = 31 }`,
    },
    go: {
      lang: 'go',
      label: 'Struct with methods',
      code: `type User struct {
    Name  string
    Email string
    Age   int
}

func NewUser(name, email string, age int) User {
    return User{Name: name, Email: email, Age: age}
}

func (u User) Greeting() string {
    return fmt.Sprintf("Hello, %s!", u.Name)
}`,
    },
    csharp: {
      lang: 'csharp',
      label: 'Record type',
      code: `public record User(
    string Name,
    string Email,
    int Age = 0
) {
    public string Greeting() => $"Hello, {Name}!";
}

var user = new User("Alice", "alice@ex.com", 30);
var updated = user with { Age = 31 };`,
    },
    dart: {
      lang: 'dart',
      label: 'Class with named parameters',
      code: `class User {
  final String name;
  final String email;
  final int age;

  const User({
    required this.name,
    required this.email,
    this.age = 0,
  });

  String greeting() => 'Hello, $name!';
}`,
    },
    julia: {
      lang: 'julia',
      label: 'Struct definition',
      code: `struct User
    name::String
    email::String
    age::Int
end

greeting(u::User) = "Hello, $(u.name)!"

mutable struct MutableUser
    name::String
    age::Int
end`,
    },
    lua: {
      lang: 'lua',
      label: 'Table-based struct',
      code: `local User = {}
User.__index = User

function User.new(name, email, age)
  return setmetatable({
    name = name, email = email, age = age
  }, User)
end

function User:greeting()
  return "Hello, " .. self.name .. "!"
end`,
    },
    zig: {
      lang: 'zig',
      label: 'Struct with methods',
      code: `const User = struct {
    name: []const u8,
    email: []const u8,
    age: u32,

    pub fn greeting(self: User) void {
        std.debug.print("Hello, {s}!\\n", .{self.name});
    }
};

const user = User{ .name = "Alice", .email = "a@b.c", .age = 30 };`,
    },
    java: {
      lang: 'java',
      label: 'Record type',
      code: `public record User(
    String name,
    String email,
    int age
) {
    public String greeting() {
        return "Hello, " + name + "!";
    }
}

var user = new User("Alice", "alice@ex.com", 30);`,
    },
    javascript: {
      lang: 'javascript',
      label: 'Class syntax',
      code: `class User {
  constructor(name, email, age = 0) {
    this.name = name;
    this.email = email;
    this.age = age;
  }

  greeting() {
    return \`Hello, \${this.name}!\`;
  }
}`,
    },
    c: {
      lang: 'c',
      label: 'Struct with typedef',
      code: `typedef struct {
    char name[64];
    char email[128];
    int age;
} User;

void user_greeting(const User *u) {
    printf("Hello, %s!\\n", u->name);
}

User user = { .name = "Alice", .email = "a@b.c", .age = 30 };`,
    },
    cpp: {
      lang: 'cpp',
      label: 'Struct with constructor',
      code: `struct User {
    std::string name;
    std::string email;
    int age;

    User(std::string n, std::string e, int a)
        : name(std::move(n)), email(std::move(e)), age(a) {}

    std::string greeting() const {
        return std::format("Hello, {}!", name);
    }
};`,
    },
    php: {
      lang: 'php',
      label: 'Readonly class',
      code: `readonly class User {
    public function __construct(
        public string $name,
        public string $email,
        public int $age = 0,
    ) {}

    public function greeting(): string {
        return "Hello, {$this->name}!";
    }
}`,
    },
    perl: {
      lang: 'perl',
      label: 'Bless-based class',
      code: `package User;
sub new {
    my ($class, %args) = @_;
    bless {
        name  => $args{name},
        email => $args{email},
        age   => $args{age} // 0,
    }, $class;
}

sub greeting {
    my ($self) = @_;
    return "Hello, $self->{name}!";
}`,
    },
    cobol: {
      lang: 'cobol',
      label: 'Group-level record',
      code: `01  USER-RECORD.
    05  USER-NAME     PIC X(30).
    05  USER-EMAIL    PIC X(50).
    05  USER-AGE      PIC 9(3).

MOVE "Alice"        TO USER-NAME.
MOVE "alice@ex.com" TO USER-EMAIL.
MOVE 30             TO USER-AGE.
DISPLAY "Hello, " USER-NAME "!".`,
    },
  },
};

// ─── Feature 6: Pattern Matching ──────────────────────────────────────────────
const patternMatching: CodeFeature = {
  name: 'Pattern Matching',
  description: 'Native pattern matching constructs for destructuring and control flow.',
  snippets: {
    haskell: {
      lang: 'haskell',
      label: 'Case expression with guards',
      code: `describe :: (Show a, Num a, Ord a) => [a] -> String
describe xs = case xs of
  []    -> "empty"
  [x]   -> "singleton: " ++ show x
  [x,y] -> "pair: " ++ show x ++ "," ++ show y
  (x:_) | x > 0     -> "starts positive"
         | otherwise -> "starts non-positive"`,
    },
    rust: {
      lang: 'rust',
      label: 'Match with destructuring',
      code: `fn describe(value: &Option<Vec<i32>>) -> &str {
    match value {
        None => "nothing",
        Some(v) if v.is_empty() => "empty list",
        Some(v) if v.len() == 1 => "singleton",
        Some(v) => "list",
    }
}`,
    },
    elixir: {
      lang: 'elixir',
      label: 'Case and function clauses',
      code: `case list do
  [] -> "empty"
  [x] -> "just #{x}"
  [h | _] when h > 0 -> "starts positive"
  _ -> "other"
end

def handle({:ok, result}), do: result
def handle({:error, reason}), do: raise reason`,
    },
    kotlin: {
      lang: 'kotlin',
      label: 'When with destructuring',
      code: `fun describe(shape: Shape): String = when (shape) {
    is Circle -> "circle r=\${shape.radius}"
    is Rectangle -> "rect \${shape.w}x\${shape.h}"
    is Triangle -> "triangle"
}

val (name, age) = person
when {
    age < 18 -> "minor"
    else -> "adult"
}`,
    },
    swift: {
      lang: 'swift',
      label: 'Switch with pattern binding',
      code: `func describe(_ value: Any) -> String {
    switch value {
    case let n as Int where n > 0:
        return "positive int: \\(n)"
    case let s as String:
        return "string: \\(s)"
    case let (x, y) as (Int, Int):
        return "pair: \\(x), \\(y)"
    default:
        return "unknown"
    }
}`,
    },
    python: {
      lang: 'python',
      label: 'Structural pattern matching',
      code: `match command:
    case ["quit"]:
        quit()
    case ["go", direction]:
        move(direction)
    case ["get", item] if item in inventory:
        pick_up(item)
    case _:
        print("Unknown command")`,
    },
    ruby: {
      lang: 'ruby',
      label: 'Case/in pattern matching',
      code: `case data
in { name: String => name, age: (18..) => age }
  puts "Adult: #{name}, #{age}"
in { name: String => name, age: Integer => age }
  puts "Minor: #{name}, #{age}"
in [Integer => x, Integer => y]
  puts "Point: #{x}, #{y}"
end`,
    },
    typescript: {
      lang: 'typescript',
      label: 'Discriminated union narrowing',
      code: `type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; w: number; h: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.radius ** 2;
    case "rect": return shape.w * shape.h;
  }
}`,
    },
    scala: {
      lang: 'scala',
      label: 'Match with extractors',
      code: `def describe(x: Any): String = x match
  case i: Int if i > 0  => s"positive: $i"
  case s: String         => s"string: $s"
  case (a, b)            => s"pair: $a, $b"
  case head :: _         => s"list starting with $head"
  case _                 => "unknown"`,
    },
    clojure: {
      lang: 'clojure',
      label: 'Core.match destructuring',
      code: `(require '[clojure.core.match :refer [match]])

(match [x y]
  [_ 0] "y is zero"
  [0 _] "x is zero"
  [a b] (str "both non-zero: " a ", " b))

(let [{:keys [name age]} person]
  (str name " is " age))`,
    },
    fsharp: {
      lang: 'fsharp',
      label: 'Match expression',
      code: `let describe = function
    | [] -> "empty"
    | [x] -> sprintf "singleton: %A" x
    | x :: _ when x > 0 -> "starts positive"
    | _ -> "other"

let area = function
    | Circle r -> System.Math.PI * r * r
    | Rect (w, h) -> w * h`,
    },
    ocaml: {
      lang: 'ocaml',
      label: 'Match with guards',
      code: `let describe = function
  | [] -> "empty"
  | [x] -> Printf.sprintf "singleton: %d" x
  | x :: _ when x > 0 -> "starts positive"
  | _ -> "other"

let area = function
  | Circle r -> Float.pi *. r *. r
  | Rect (w, h) -> w *. h`,
    },
    csharp: {
      lang: 'csharp',
      label: 'Switch expression with patterns',
      code: `string Describe(object obj) => obj switch
{
    int n when n > 0     => $"positive: {n}",
    string s             => $"string: {s}",
    (int x, int y)       => $"point: {x},{y}",
    null                 => "null",
    _                    => "unknown"
};`,
    },
    dart: {
      lang: 'dart',
      label: 'Switch with patterns',
      code: `String describe(Object obj) => switch (obj) {
  int n when n > 0 => 'positive: $n',
  String s         => 'string: $s',
  (int x, int y)   => 'point: $x, $y',
  _                => 'unknown',
};`,
    },
    julia: {
      lang: 'julia',
      label: 'Multiple dispatch as pattern matching',
      code: `describe(::Nothing) = "nothing"
describe(x::Int) = x > 0 ? "positive" : "non-positive"
describe(s::String) = "string: $s"
describe(v::Vector) = isempty(v) ? "empty" : "list"
describe(_) = "unknown"`,
    },
    // Languages without native pattern matching
    go: undefined,
    c: undefined,
    cpp: undefined,
    java: undefined,
    javascript: undefined,
    php: undefined,
    perl: undefined,
    lua: undefined,
    zig: undefined,
    cobol: undefined,
  },
};

// ─── Feature 7: Error Handling ────────────────────────────────────────────────
const errorHandling: CodeFeature = {
  name: 'Error Handling',
  description: 'Exception handling via try/catch or Result/Either patterns.',
  snippets: {
    haskell: {
      lang: 'haskell',
      label: 'Either monad',
      code: `type Error = String

safeDivide :: Double -> Double -> Either Error Double
safeDivide _ 0 = Left "Division by zero"
safeDivide a b = Right (a / b)

compute :: Either Error Double
compute = do
  x <- safeDivide 10 2
  y <- safeDivide x 3
  return (x + y)`,
    },
    rust: {
      lang: 'rust',
      label: 'Result and ? operator',
      code: `use std::num::ParseIntError;

fn parse_and_double(s: &str) -> Result<i32, ParseIntError> {
    let n = s.parse::<i32>()?;
    Ok(n * 2)
}

fn main() {
    match parse_and_double("42") {
        Ok(val) => println!("Got: {}", val),
        Err(e) => eprintln!("Error: {}", e),
    }
}`,
    },
    elixir: {
      lang: 'elixir',
      label: 'With and tagged tuples',
      code: `with {:ok, user} <- fetch_user(id),
     {:ok, posts} <- fetch_posts(user.id),
     {:ok, _} <- validate(posts) do
  {:ok, format_response(user, posts)}
else
  {:error, :not_found} -> {:error, "User not found"}
  {:error, reason} -> {:error, reason}
end`,
    },
    kotlin: {
      lang: 'kotlin',
      label: 'Try/catch with runCatching',
      code: `fun parseNumber(s: String): Result<Int> =
    runCatching { s.toInt() }

val result = parseNumber("42")
    .map { it * 2 }
    .getOrElse { -1 }

val value = try {
    riskyOperation()
} catch (e: IOException) {
    fallbackValue
}`,
    },
    swift: {
      lang: 'swift',
      label: 'Do/try/catch',
      code: `enum ParseError: Error {
    case invalidInput(String)
}

func parse(_ s: String) throws -> Int {
    guard let n = Int(s) else {
        throw ParseError.invalidInput(s)
    }
    return n
}

let result = try? parse("42") ?? -1`,
    },
    python: {
      lang: 'python',
      label: 'Try/except with context',
      code: `def parse_number(s: str) -> int:
    try:
        return int(s)
    except ValueError as e:
        raise ValueError(f"Invalid: {s}") from e

try:
    result = parse_number(input_str)
except ValueError:
    result = -1
finally:
    cleanup()`,
    },
    ruby: {
      lang: 'ruby',
      label: 'Begin/rescue/ensure',
      code: `def parse_number(str)
  Integer(str)
rescue ArgumentError => e
  raise "Invalid input: #{str}"
end

begin
  result = parse_number(input)
rescue => e
  puts "Error: #{e.message}"
  result = -1
ensure
  cleanup
end`,
    },
    typescript: {
      lang: 'typescript',
      label: 'Try/catch with Result type',
      code: `type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

function safeParse(s: string): Result<number> {
  const n = Number(s);
  return isNaN(n)
    ? { ok: false, error: new Error(\`Invalid: \${s}\`) }
    : { ok: true, value: n };
}

const result = safeParse("42");
if (result.ok) console.log(result.value);`,
    },
    scala: {
      lang: 'scala',
      label: 'Try and Either',
      code: `import scala.util.{Try, Success, Failure}

def parse(s: String): Either[String, Int] =
  Try(s.toInt).toEither.left.map(_.getMessage)

val result = for
  x <- parse("42")
  y <- parse("7")
yield x + y

result match
  case Right(v) => println(s"Got: $v")
  case Left(e)  => println(s"Error: $e")`,
    },
    clojure: {
      lang: 'clojure',
      label: 'Try/catch and ex-info',
      code: `(defn parse-number [s]
  (try
    (Integer/parseInt s)
    (catch NumberFormatException _
      (throw (ex-info "Invalid input"
                      {:input s})))))

(try
  (parse-number "42")
  (catch Exception e
    (println "Error:" (ex-message e))))`,
    },
    fsharp: {
      lang: 'fsharp',
      label: 'Result type',
      code: `let safeDivide a b =
    if b = 0.0 then Error "Division by zero"
    else Ok (a / b)

let compute =
    safeDivide 10.0 2.0
    |> Result.bind (fun x -> safeDivide x 3.0)
    |> Result.map (fun y -> y + 1.0)

match compute with
| Ok v -> printfn "Got: %f" v
| Error e -> printfn "Error: %s" e`,
    },
    ocaml: {
      lang: 'ocaml',
      label: 'Result type and exceptions',
      code: `let safe_divide a b =
  if b = 0.0 then Error "Division by zero"
  else Ok (a /. b)

let compute =
  Result.bind (safe_divide 10.0 2.0)
    (fun x -> safe_divide x 3.0)

match compute with
| Ok v -> Printf.printf "Got: %f\\n" v
| Error e -> Printf.printf "Error: %s\\n" e`,
    },
    go: {
      lang: 'go',
      label: 'Error return values',
      code: `func parseNumber(s string) (int, error) {
    n, err := strconv.Atoi(s)
    if err != nil {
        return 0, fmt.Errorf("invalid input %q: %w", s, err)
    }
    return n, nil
}

if result, err := parseNumber("42"); err != nil {
    log.Fatal(err)
} else {
    fmt.Println(result)
}`,
    },
    csharp: {
      lang: 'csharp',
      label: 'Try/catch with filtering',
      code: `try
{
    var result = int.Parse(input);
    Console.WriteLine(result * 2);
}
catch (FormatException e) when (e.Message.Contains("Input"))
{
    Console.WriteLine($"Invalid: {e.Message}");
}
catch (Exception e)
{
    Console.WriteLine($"Error: {e.Message}");
}
finally { Cleanup(); }`,
    },
    dart: {
      lang: 'dart',
      label: 'Try/catch/finally',
      code: `int parseNumber(String s) {
  try {
    return int.parse(s);
  } on FormatException catch (e) {
    throw ArgumentError('Invalid: $s');
  }
}

try {
  final result = parseNumber('42');
  print(result);
} catch (e) {
  print('Error: $e');
}`,
    },
    julia: {
      lang: 'julia',
      label: 'Try/catch blocks',
      code: `function parse_number(s::String)
    try
        parse(Int, s)
    catch e
        if isa(e, ArgumentError)
            error("Invalid input: $s")
        end
        rethrow()
    end
end

result = try
    parse_number("42")
catch e
    -1
end`,
    },
    lua: {
      lang: 'lua',
      label: 'Pcall and xpcall',
      code: `local ok, result = pcall(function()
  return tonumber("42") or error("invalid")
end)

if ok then
  print("Got: " .. result)
else
  print("Error: " .. result)
end

local ok2, val = xpcall(risky_fn, debug.traceback)`,
    },
    zig: {
      lang: 'zig',
      label: 'Error unions and try',
      code: `const ParseError = error{InvalidInput};

fn parseNumber(s: []const u8) ParseError!i32 {
    return std.fmt.parseInt(i32, s, 10) catch
        return ParseError.InvalidInput;
}

const result = parseNumber("42") catch |err| {
    std.debug.print("Error: {}\\n", .{err});
    return;
};`,
    },
    java: {
      lang: 'java',
      label: 'Try/catch/finally',
      code: `int parseNumber(String s) throws NumberFormatException {
    return Integer.parseInt(s);
}

try {
    var result = parseNumber("42");
    System.out.println(result);
} catch (NumberFormatException e) {
    System.err.println("Invalid: " + e.getMessage());
} finally {
    cleanup();
}`,
    },
    javascript: {
      lang: 'javascript',
      label: 'Try/catch with async',
      code: `async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
    return await response.json();
  } catch (error) {
    console.error("Fetch failed:", error.message);
    return null;
  }
}`,
    },
    c: {
      lang: 'c',
      label: 'Error codes and errno',
      code: `#include <errno.h>

int parse_number(const char *s, int *out) {
    char *end;
    errno = 0;
    long val = strtol(s, &end, 10);
    if (errno != 0 || *end != '\\0') return -1;
    *out = (int)val;
    return 0;
}

int result;
if (parse_number("42", &result) != 0)
    fprintf(stderr, "Invalid input\\n");`,
    },
    cpp: {
      lang: 'cpp',
      label: 'Exceptions and expected',
      code: `#include <stdexcept>

int parseNumber(const std::string& s) {
    try {
        return std::stoi(s);
    } catch (const std::invalid_argument& e) {
        throw std::runtime_error("Invalid: " + s);
    }
}

try {
    auto result = parseNumber("42");
} catch (const std::exception& e) {
    std::cerr << e.what() << "\\n";
}`,
    },
    php: {
      lang: 'php',
      label: 'Try/catch/finally',
      code: `function parseNumber(string $s): int {
    if (!is_numeric($s)) {
        throw new InvalidArgumentException("Invalid: $s");
    }
    return (int) $s;
}

try {
    $result = parseNumber('42');
} catch (InvalidArgumentException $e) {
    echo "Error: " . $e->getMessage();
} finally {
    cleanup();
}`,
    },
    perl: {
      lang: 'perl',
      label: 'Eval and die',
      code: `sub parse_number {
    my ($s) = @_;
    die "Invalid input: $s\\n" unless $s =~ /^\\d+$/;
    return int($s);
}

my $result = eval { parse_number("42") };
if ($@) {
    warn "Error: $@";
    $result = -1;
}`,
    },
    cobol: {
      lang: 'cobol',
      label: 'Declaratives and on error',
      code: `PROCEDURE DIVISION.
DECLARATIVES.
INPUT-ERROR SECTION.
    USE AFTER STANDARD ERROR PROCEDURE ON INPUT.
    DISPLAY "Error reading input file".
END DECLARATIVES.

MAIN-LOGIC.
    READ INPUT-FILE
        AT END MOVE "Y" TO WS-EOF
        NOT AT END PERFORM PROCESS-RECORD
    END-READ.`,
    },
  },
};

// ─── Feature 8: String Interpolation ──────────────────────────────────────────
const stringInterpolation: CodeFeature = {
  name: 'String Interpolation',
  description: 'Embedding expressions and variables within string literals.',
  snippets: {
    haskell: {
      lang: 'haskell',
      label: 'Concatenation (no native interpolation)',
      code: `-- Haskell uses concatenation or printf
greeting :: String -> Int -> String
greeting name age =
  "Hello, " ++ name ++ "! You are "
    ++ show age ++ " years old."

-- With Text.Printf
import Text.Printf
msg = printf "Hello, %s! Age: %d" name age`,
    },
    rust: {
      lang: 'rust',
      label: 'Format macro',
      code: `let name = "Rust";
let version = 2024;

let msg = format!("Hello, {}! Version: {}", name, version);
let aligned = format!("{:<10} | {:>5}", name, version);
let debug = format!("Value: {:?}", some_struct);

println!("Welcome to {name} {version}!");`,
    },
    elixir: {
      lang: 'elixir',
      label: 'String interpolation with #{}',
      code: `name = "Elixir"
version = 1.16

msg = "Hello, #{name}! Version: #{version}"
multi = """
Welcome to #{String.upcase(name)}.
Released: #{version}
"""`,
    },
    kotlin: {
      lang: 'kotlin',
      label: 'String templates',
      code: `val name = "Kotlin"
val version = 2.0

val msg = "Hello, $name! Version: $version"
val expr = "Length: \${name.length}, Upper: \${name.uppercase()}"
val multi = """
    |Welcome to $name
    |Version: $version
""".trimMargin()`,
    },
    swift: {
      lang: 'swift',
      label: 'String interpolation',
      code: `let name = "Swift"
let version = 5.10

let msg = "Hello, \\(name)! Version: \\(version)"
let expr = "Length: \\(name.count), Upper: \\(name.uppercased())"
let multi = """
Welcome to \\(name).
Version: \\(version)
"""`,
    },
    python: {
      lang: 'python',
      label: 'F-strings',
      code: `name = "Python"
version = 3.12

msg = f"Hello, {name}! Version: {version}"
expr = f"Length: {len(name)}, Upper: {name.upper()}"
aligned = f"{name:<10} | {version:>5.1f}"
debug = f"{name!r} has {len(name)} chars"`,
    },
    ruby: {
      lang: 'ruby',
      label: 'String interpolation with #{}',
      code: `name = "Ruby"
version = 3.3

msg = "Hello, #{name}! Version: #{version}"
expr = "Length: #{name.length}, Upper: #{name.upcase}"
heredoc = <<~TEXT
  Welcome to #{name}.
  Version: #{version}
TEXT`,
    },
    typescript: {
      lang: 'typescript',
      label: 'Template literals',
      code: `const name = "TypeScript";
const version = 5.4;

const msg = \`Hello, \${name}! Version: \${version}\`;
const expr = \`Length: \${name.length}, Upper: \${name.toUpperCase()}\`;
const multi = \`
Welcome to \${name}.
Version: \${version}
\`;`,
    },
    scala: {
      lang: 'scala',
      label: 'String interpolation',
      code: `val name = "Scala"
val version = 3.4

val msg = s"Hello, $name! Version: $version"
val expr = s"Length: \${name.length}, Upper: \${name.toUpperCase}"
val formatted = f"$name%-10s | $version%5.1f"

val raw = raw"No \\n escape: $name"`,
    },
    clojure: {
      lang: 'clojure',
      label: 'Str and format',
      code: `(def name "Clojure")
(def version 1.12)

(str "Hello, " name "! Version: " version)
(format "Hello, %s! Version: %.1f" name version)

(println (str "Welcome to " name ". "
              "Version: " version))`,
    },
    fsharp: {
      lang: 'fsharp',
      label: 'Interpolated strings',
      code: `let name = "F#"
let version = 8.0

let msg = $"Hello, {name}! Version: {version}"
let expr = $"Length: {name.Length}, Upper: {name.ToUpper()}"
let formatted = sprintf "%-10s | %5.1f" name version`,
    },
    ocaml: {
      lang: 'ocaml',
      label: 'Printf formatting',
      code: `let name = "OCaml"
let version = 5.1

let msg = Printf.sprintf "Hello, %s! Version: %.1f" name version
let () = Printf.printf "Welcome to %s.\\nVersion: %.1f\\n"
           name version`,
    },
    go: {
      lang: 'go',
      label: 'Fmt.Sprintf',
      code: `name := "Go"
version := 1.22

msg := fmt.Sprintf("Hello, %s! Version: %.2f", name, version)
aligned := fmt.Sprintf("%-10s | %5.2f", name, version)

fmt.Printf("Welcome to %s.\\nVersion: %v\\n", name, version)`,
    },
    csharp: {
      lang: 'csharp',
      label: 'Interpolated strings',
      code: `var name = "C#";
var version = 12.0;

var msg = $"Hello, {name}! Version: {version}";
var expr = $"Length: {name.Length}, Upper: {name.ToUpper()}";
var aligned = $"{name,-10} | {version,5:F1}";
var raw = $"""Welcome to {name}. Version: {version}""";`,
    },
    dart: {
      lang: 'dart',
      label: 'String interpolation',
      code: `final name = 'Dart';
final version = 3.3;

final msg = 'Hello, $name! Version: $version';
final expr = 'Length: \${name.length}, Upper: \${name.toUpperCase()}';
final multi = '''
Welcome to $name.
Version: $version
''';`,
    },
    julia: {
      lang: 'julia',
      label: 'String interpolation',
      code: `name = "Julia"
version = 1.10

msg = "Hello, $name! Version: $version"
expr = "Length: $(length(name)), Upper: $(uppercase(name))"

using Printf
formatted = @sprintf("%-10s | %5.1f", name, version)`,
    },
    lua: {
      lang: 'lua',
      label: 'String.format',
      code: `local name = "Lua"
local version = 5.4

local msg = string.format("Hello, %s! Version: %.1f", name, version)
local concat = "Hello, " .. name .. "! Version: " .. version

print(string.format("%-10s | %5.1f", name, version))`,
    },
    zig: {
      lang: 'zig',
      label: 'Std.fmt format strings',
      code: `const name = "Zig";
const version: f32 = 0.12;

std.debug.print("Hello, {s}! Version: {d:.2}\\n", .{ name, version });

var buf: [256]u8 = undefined;
const msg = std.fmt.bufPrint(&buf, "Welcome to {s}", .{name})
    catch unreachable;`,
    },
    java: {
      lang: 'java',
      label: 'String.format and text blocks',
      code: `String name = "Java";
int version = 21;

String msg = "Hello, %s! Version: %d".formatted(name, version);
String template = STR."Hello, \\{name}! Version: \\{version}";

String multi = """
    Welcome to %s.
    Version: %d
    """.formatted(name, version);`,
    },
    javascript: {
      lang: 'javascript',
      label: 'Template literals',
      code: `const name = "JavaScript";
const version = 2024;

const msg = \`Hello, \${name}! Version: \${version}\`;
const expr = \`Length: \${name.length}, Upper: \${name.toUpperCase()}\`;
const multi = \`
Welcome to \${name}.
Version: \${version}
\`;`,
    },
    c: {
      lang: 'c',
      label: 'Printf formatting',
      code: `const char *name = "C";
int version = 23;

printf("Hello, %s! Version: C%d\\n", name, version);

char buf[128];
snprintf(buf, sizeof(buf),
    "Welcome to %s. Version: %d", name, version);`,
    },
    cpp: {
      lang: 'cpp',
      label: 'Std::format',
      code: `auto name = std::string("C++");
auto version = 23;

auto msg = std::format("Hello, {}! Version: C++{}", name, version);
auto aligned = std::format("{:<10} | {:>5}", name, version);

std::println("Welcome to {}. Version: {}", name, version);`,
    },
    php: {
      lang: 'php',
      label: 'Double-quoted interpolation',
      code: `$name = 'PHP';
$version = 8.3;

$msg = "Hello, $name! Version: $version";
$expr = "Length: {$name}[" . strlen($name) . "]";
$heredoc = <<<EOT
Welcome to $name.
Version: $version
EOT;

$formatted = sprintf("%-10s | %5.1f", $name, $version);`,
    },
    perl: {
      lang: 'perl',
      label: 'Double-quoted interpolation',
      code: `my $name = "Perl";
my $version = 5.38;

my $msg = "Hello, $name! Version: $version";
my $expr = "Length: @{[length($name)]}";
my $heredoc = <<~END;
    Welcome to $name.
    Version: $version
    END

printf "%-10s | %5.1f\\n", $name, $version;`,
    },
    cobol: {
      lang: 'cobol',
      label: 'String concatenation',
      code: `01  WS-NAME    PIC X(10) VALUE "COBOL".
01  WS-MSG     PIC X(50).

STRING "HELLO, " DELIMITED BY SIZE
       WS-NAME  DELIMITED BY SPACES
       "!"      DELIMITED BY SIZE
    INTO WS-MSG.

DISPLAY WS-MSG.`,
    },
  },
};

// ─── Feature 9: List Operations ───────────────────────────────────────────────
const listOperations: CodeFeature = {
  name: 'List Operations',
  description: 'Map, filter, reduce and functional collection transformations.',
  snippets: {
    haskell: {
      lang: 'haskell',
      label: 'Map, filter, fold',
      code: `numbers :: [Int]
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

doubled  = map (* 2) numbers
evens    = filter even numbers
total    = foldl (+) 0 numbers
squares  = [x * x | x <- numbers, even x]`,
    },
    rust: {
      lang: 'rust',
      label: 'Iterator chains',
      code: `let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

let result: Vec<i32> = numbers.iter()
    .filter(|&&n| n % 2 == 0)
    .map(|&n| n * n)
    .collect();

let sum: i32 = numbers.iter().sum();`,
    },
    elixir: {
      lang: 'elixir',
      label: 'Enum pipeline',
      code: `numbers = 1..10

doubled = Enum.map(numbers, &(&1 * 2))
evens   = Enum.filter(numbers, &(rem(&1, 2) == 0))
total   = Enum.reduce(numbers, 0, &+/2)

result = numbers
|> Enum.filter(&(rem(&1, 2) == 0))
|> Enum.map(&(&1 * &1))`,
    },
    kotlin: {
      lang: 'kotlin',
      label: 'Collection operations',
      code: `val numbers = (1..10).toList()

val doubled = numbers.map { it * 2 }
val evens = numbers.filter { it % 2 == 0 }
val total = numbers.reduce { acc, n -> acc + n }

val result = numbers
    .filter { it % 2 == 0 }
    .map { it * it }
    .sum()`,
    },
    swift: {
      lang: 'swift',
      label: 'Higher-order functions',
      code: `let numbers = Array(1...10)

let doubled = numbers.map { $0 * 2 }
let evens = numbers.filter { $0 % 2 == 0 }
let total = numbers.reduce(0, +)

let result = numbers
    .filter { $0.isMultiple(of: 2) }
    .map { $0 * $0 }`,
    },
    python: {
      lang: 'python',
      label: 'Comprehensions and builtins',
      code: `numbers = list(range(1, 11))

doubled = [n * 2 for n in numbers]
evens = [n for n in numbers if n % 2 == 0]
total = sum(numbers)

squares = list(map(lambda n: n * n,
                   filter(lambda n: n % 2 == 0, numbers)))`,
    },
    ruby: {
      lang: 'ruby',
      label: 'Enumerable methods',
      code: `numbers = (1..10).to_a

doubled = numbers.map { |n| n * 2 }
evens = numbers.select(&:even?)
total = numbers.reduce(:+)

result = numbers
  .select(&:even?)
  .map { |n| n ** 2 }
  .sum`,
    },
    typescript: {
      lang: 'typescript',
      label: 'Array methods',
      code: `const numbers = Array.from({ length: 10 }, (_, i) => i + 1);

const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const total = numbers.reduce((acc, n) => acc + n, 0);

const result = numbers
  .filter(n => n % 2 === 0)
  .map(n => n ** 2);`,
    },
    scala: {
      lang: 'scala',
      label: 'Collection transformations',
      code: `val numbers = (1 to 10).toList

val doubled = numbers.map(_ * 2)
val evens = numbers.filter(_ % 2 == 0)
val total = numbers.reduce(_ + _)

val result = numbers
  .filter(_ % 2 == 0)
  .map(n => n * n)
  .sum`,
    },
    clojure: {
      lang: 'clojure',
      label: 'Seq operations',
      code: `(def numbers (range 1 11))

(def doubled (map #(* % 2) numbers))
(def evens (filter even? numbers))
(def total (reduce + numbers))

(->> numbers
     (filter even?)
     (map #(* % %))
     (reduce +))`,
    },
    fsharp: {
      lang: 'fsharp',
      label: 'List module pipeline',
      code: `let numbers = [1 .. 10]

let doubled = List.map ((*) 2) numbers
let evens = List.filter (fun n -> n % 2 = 0) numbers
let total = List.sum numbers

let result =
    numbers
    |> List.filter (fun n -> n % 2 = 0)
    |> List.map (fun n -> n * n)
    |> List.sum`,
    },
    ocaml: {
      lang: 'ocaml',
      label: 'List module functions',
      code: `let numbers = List.init 10 (fun i -> i + 1)

let doubled = List.map (( * ) 2) numbers
let evens = List.filter (fun n -> n mod 2 = 0) numbers
let total = List.fold_left ( + ) 0 numbers

let result =
  numbers
  |> List.filter (fun n -> n mod 2 = 0)
  |> List.map (fun n -> n * n)`,
    },
    go: {
      lang: 'go',
      label: 'Manual iteration (no generics map/filter)',
      code: `numbers := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

var evens []int
for _, n := range numbers {
    if n%2 == 0 {
        evens = append(evens, n)
    }
}

sum := 0
for _, n := range numbers {
    sum += n
}`,
    },
    csharp: {
      lang: 'csharp',
      label: 'LINQ operations',
      code: `var numbers = Enumerable.Range(1, 10).ToList();

var doubled = numbers.Select(n => n * 2);
var evens = numbers.Where(n => n % 2 == 0);
var total = numbers.Sum();

var result = numbers
    .Where(n => n % 2 == 0)
    .Select(n => n * n)
    .Sum();`,
    },
    dart: {
      lang: 'dart',
      label: 'Iterable methods',
      code: `final numbers = List.generate(10, (i) => i + 1);

final doubled = numbers.map((n) => n * 2).toList();
final evens = numbers.where((n) => n % 2 == 0).toList();
final total = numbers.reduce((a, b) => a + b);

final result = numbers
    .where((n) => n % 2 == 0)
    .map((n) => n * n)
    .toList();`,
    },
    julia: {
      lang: 'julia',
      label: 'Broadcasting and comprehensions',
      code: `numbers = 1:10

doubled = numbers .* 2
evens = filter(iseven, collect(numbers))
total = sum(numbers)

result = [n^2 for n in numbers if iseven(n)]
piped = numbers |> collect |> x -> filter(iseven, x)`,
    },
    lua: {
      lang: 'lua',
      label: 'Manual iteration',
      code: `local numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

local evens = {}
for _, n in ipairs(numbers) do
  if n % 2 == 0 then
    evens[#evens + 1] = n
  end
end

local sum = 0
for _, n in ipairs(numbers) do sum = sum + n end`,
    },
    zig: {
      lang: 'zig',
      label: 'Manual iteration with arrays',
      code: `const numbers = [_]i32{ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

var sum: i32 = 0;
for (numbers) |n| {
    sum += n;
}

var evens: [5]i32 = undefined;
var idx: usize = 0;
for (numbers) |n| {
    if (@mod(n, 2) == 0) { evens[idx] = n; idx += 1; }
}`,
    },
    java: {
      lang: 'java',
      label: 'Stream API',
      code: `var numbers = IntStream.rangeClosed(1, 10).boxed().toList();

var doubled = numbers.stream().map(n -> n * 2).toList();
var evens = numbers.stream().filter(n -> n % 2 == 0).toList();
var total = numbers.stream().mapToInt(Integer::intValue).sum();

var result = numbers.stream()
    .filter(n -> n % 2 == 0)
    .map(n -> n * n)
    .toList();`,
    },
    javascript: {
      lang: 'javascript',
      label: 'Array methods',
      code: `const numbers = Array.from({ length: 10 }, (_, i) => i + 1);

const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const total = numbers.reduce((acc, n) => acc + n, 0);

const result = numbers
  .filter(n => n % 2 === 0)
  .map(n => n ** 2);`,
    },
    c: {
      lang: 'c',
      label: 'Manual array operations',
      code: `int numbers[] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
int len = sizeof(numbers) / sizeof(numbers[0]);

int sum = 0;
for (int i = 0; i < len; i++) sum += numbers[i];

int evens[10], count = 0;
for (int i = 0; i < len; i++)
    if (numbers[i] % 2 == 0) evens[count++] = numbers[i];`,
    },
    cpp: {
      lang: 'cpp',
      label: 'Ranges and algorithms',
      code: `auto numbers = std::views::iota(1, 11) | std::ranges::to<std::vector>();

auto doubled = numbers | std::views::transform([](int n) { return n * 2; });
auto evens = numbers | std::views::filter([](int n) { return n % 2 == 0; });
auto total = std::accumulate(numbers.begin(), numbers.end(), 0);`,
    },
    php: {
      lang: 'php',
      label: 'Array functions',
      code: `$numbers = range(1, 10);

$doubled = array_map(fn($n) => $n * 2, $numbers);
$evens = array_filter($numbers, fn($n) => $n % 2 === 0);
$total = array_sum($numbers);

$result = array_map(
    fn($n) => $n ** 2,
    array_filter($numbers, fn($n) => $n % 2 === 0)
);`,
    },
    perl: {
      lang: 'perl',
      label: 'Map and grep',
      code: `my @numbers = (1..10);

my @doubled = map { $_ * 2 } @numbers;
my @evens = grep { $_ % 2 == 0 } @numbers;

use List::Util qw(reduce sum);
my $total = sum @numbers;

my @result = map { $_ ** 2 }
             grep { $_ % 2 == 0 } @numbers;`,
    },
    cobol: {
      lang: 'cobol',
      label: 'Perform through array',
      code: `01  WS-NUMBERS.
    05  WS-NUM PIC 9(4) OCCURS 10 TIMES.
01  WS-SUM     PIC 9(6) VALUE ZERO.
01  WS-I       PIC 9(2).

PERFORM VARYING WS-I FROM 1 BY 1
    UNTIL WS-I > 10
    ADD WS-NUM(WS-I) TO WS-SUM
END-PERFORM.
DISPLAY "Sum: " WS-SUM.`,
    },
  },
};

// ─── Feature 10: Signature Idiom ─────────────────────────────────────────────
const signatureIdiom: CodeFeature = {
  name: 'Signature Idiom',
  description: 'The characteristic code snippet that best represents each language.',
  snippets: Object.fromEntries(
    ALL_LANGS.map((id) => [id, SNIPPETS[id] as FeatureCodeSnippet | undefined])
  ) as Record<string, FeatureCodeSnippet | undefined>,
};

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * All 10 code features for the comparison page.
 * Each feature contains code snippets for up to 25 languages.
 */
export const CODE_FEATURES: CodeFeature[] = [
  variableDeclaration,
  ifElse,
  loops,
  functions,
  structs,
  patternMatching,
  errorHandling,
  stringInterpolation,
  listOperations,
  signatureIdiom,
];

/**
 * Returns an array of language IDs that support the given feature.
 * @param featureIndex - Index into CODE_FEATURES (0-9)
 * @returns Array of language ID strings where the feature snippet is defined
 */
export function getFeatureSupport(featureIndex: number): string[] {
  const feature = CODE_FEATURES[featureIndex];
  if (!feature) return [];
  return ALL_LANGS.filter((id) => feature.snippets[id] !== undefined);
}
