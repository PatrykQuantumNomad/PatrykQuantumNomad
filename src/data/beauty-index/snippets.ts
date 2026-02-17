/** A representative code snippet for a programming language */
export interface CodeSnippet {
  /** Shiki language identifier for syntax highlighting */
  lang: string;
  /** Short description of what the snippet demonstrates */
  label: string;
  /** The actual source code (5-12 lines) */
  code: string;
}

/**
 * Signature code snippets for all 25 Beauty Index languages.
 * Each snippet showcases what makes that language distinctive.
 * Keyed by language ID matching entry.data.id values.
 */
export const SNIPPETS: Record<string, CodeSnippet> = {
  haskell: {
    lang: 'haskell',
    label: 'Elegant quicksort',
    code: `quicksort :: Ord a => [a] -> [a]
quicksort []     = []
quicksort (x:xs) =
  quicksort smaller ++ [x] ++ quicksort bigger
  where
    smaller = [a | a <- xs, a <= x]
    bigger  = [a | a <- xs, a > x]`,
  },

  rust: {
    lang: 'rust',
    label: 'Pattern matching with enums',
    code: `enum Shape {
    Circle(f64),
    Rectangle(f64, f64),
    Triangle(f64, f64, f64),
}

fn area(shape: &Shape) -> f64 {
    match shape {
        Shape::Circle(r) => std::f64::consts::PI * r * r,
        Shape::Rectangle(w, h) => w * h,
        Shape::Triangle(a, b, c) => {
            let s = (a + b + c) / 2.0;
            (s * (s - a) * (s - b) * (s - c)).sqrt()
        }
    }
}`,
  },

  elixir: {
    lang: 'elixir',
    label: 'Pipe operator + pattern matching',
    code: `def process_order(%Order{items: items, user: user}) do
  items
  |> Enum.filter(&(&1.in_stock))
  |> Enum.map(&apply_discount(&1, user.tier))
  |> Enum.reduce(0, &(&1.price + &2))
  |> apply_tax(user.region)
  |> format_total()
end`,
  },

  kotlin: {
    lang: 'kotlin',
    label: 'Data classes + null safety',
    code: `data class User(val name: String, val email: String?)

fun greet(users: List<User>): List<String> =
    users
        .filter { it.email != null }
        .sortedBy { it.name }
        .map { user ->
            "Hello, \${user.name} (\${user.email!!})"
        }`,
  },

  swift: {
    lang: 'swift',
    label: 'Protocol-oriented design',
    code: `protocol Drawable {
    func draw() -> String
}

extension Drawable {
    func debugDraw() -> String { "[\(draw())]" }
}

struct Circle: Drawable {
    let radius: Double
    func draw() -> String {
        "Circle(r=\(radius))"
    }
}`,
  },

  python: {
    lang: 'python',
    label: 'Generators + comprehensions',
    code: `def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

squares = {
    n: n**2
    for n in fibonacci()
    if n > 0 and n < 100
}`,
  },

  ruby: {
    lang: 'ruby',
    label: 'Blocks and method chaining',
    code: `class Array
  def histogram
    each_with_object(Hash.new(0)) { |item, counts|
      counts[item] += 1
    }
    .sort_by { |_, count| -count }
    .map { |item, count| "\#{item}: \#{'*' * count}" }
    .join("\\n")
  end
end`,
  },

  typescript: {
    lang: 'typescript',
    label: 'Discriminated unions',
    code: `type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function parse(input: string): Result<number> {
  const n = Number(input);
  return isNaN(n)
    ? { ok: false, error: new Error(\`Invalid: \${input}\`) }
    : { ok: true, value: n };
}`,
  },

  scala: {
    lang: 'scala',
    label: 'For-comprehension',
    code: `case class User(name: String, age: Int)

def findEligible(
    users: List[User],
    minAge: Int
): List[String] =
  for {
    user <- users
    if user.age >= minAge
    initial = user.name.head.toUpper
  } yield s"\$initial. \${user.name} (age \${user.age})"`,
  },

  clojure: {
    lang: 'clojure',
    label: 'Threading macro',
    code: `(defn process-users [users]
  (->> users
       (filter :active)
       (map :email)
       (map clojure.string/lower-case)
       (sort)
       (dedupe)
       (into [])))`,
  },

  fsharp: {
    lang: 'fsharp',
    label: 'Pipe + discriminated unions',
    code: `type Shape =
    | Circle of radius: float
    | Rect of width: float * height: float

let area = function
    | Circle r -> System.Math.PI * r * r
    | Rect (w, h) -> w * h

let totalArea shapes =
    shapes
    |> List.map area
    |> List.sum`,
  },

  ocaml: {
    lang: 'ocaml',
    label: 'Recursive pattern match',
    code: `type 'a tree =
  | Leaf
  | Node of 'a tree * 'a * 'a tree

let rec fold f acc = function
  | Leaf -> acc
  | Node (left, value, right) ->
    let acc = fold f acc left in
    let acc = f acc value in
    fold f acc right`,
  },

  go: {
    lang: 'go',
    label: 'Goroutines + channels',
    code: `func fanIn(channels ...<-chan string) <-chan string {
    merged := make(chan string)
    var wg sync.WaitGroup
    for _, ch := range channels {
        wg.Add(1)
        go func(c <-chan string) {
            defer wg.Done()
            for msg := range c {
                merged <- msg
            }
        }(ch)
    }
    go func() { wg.Wait(); close(merged) }()
    return merged
}`,
  },

  csharp: {
    lang: 'csharp',
    label: 'LINQ query',
    code: `var summary =
    from order in orders
    where order.Date.Year == 2024
    group order by order.Category into g
    orderby g.Sum(o => o.Total) descending
    select new {
        Category = g.Key,
        Revenue = g.Sum(o => o.Total),
        Count = g.Count()
    };`,
  },

  dart: {
    lang: 'dart',
    label: 'Cascade notation',
    code: `final paint = Paint()
  ..color = Colors.blue
  ..strokeWidth = 4.0
  ..style = PaintingStyle.stroke;

final path = Path()
  ..moveTo(0, 0)
  ..lineTo(100, 0)
  ..lineTo(100, 100)
  ..close();

canvas.drawPath(path, paint);`,
  },

  julia: {
    lang: 'julia',
    label: 'Multiple dispatch',
    code: `abstract type Shape end
struct Circle <: Shape; r::Float64 end
struct Rect   <: Shape; w::Float64; h::Float64 end

area(c::Circle) = pi * c.r^2
area(r::Rect)   = r.w * r.h

combine(a::Circle, b::Circle) = Circle(sqrt(a.r^2 + b.r^2))
combine(a::Rect,   b::Rect)   = Rect(a.w + b.w, max(a.h, b.h))
combine(a::Shape,  b::Shape)  = area(a) + area(b)`,
  },

  lua: {
    lang: 'lua',
    label: 'Metatables',
    code: `local Vector = {}
Vector.__index = Vector

function Vector.new(x, y)
  return setmetatable({x = x, y = y}, Vector)
end

function Vector:length()
  return math.sqrt(self.x^2 + self.y^2)
end

function Vector.__add(a, b)
  return Vector.new(a.x + b.x, a.y + b.y)
end`,
  },

  zig: {
    lang: 'zig',
    label: 'Comptime',
    code: `fn fibonacci(comptime n: u32) u128 {
    var a: u128 = 0;
    var b: u128 = 1;
    for (0..n) |_| {
        const tmp = a;
        a = b;
        b = tmp + b;
    }
    return a;
}

// Computed at compile time, zero runtime cost
const fib_50 = fibonacci(50);`,
  },

  java: {
    lang: 'java',
    label: 'Streams API',
    code: `Map<String, Long> wordFrequency =
    Files.lines(Path.of("book.txt"))
        .flatMap(line -> Arrays.stream(line.split("\\\\s+")))
        .map(String::toLowerCase)
        .filter(w -> w.length() > 3)
        .collect(Collectors.groupingBy(
            Function.identity(),
            Collectors.counting()
        ));`,
  },

  javascript: {
    lang: 'javascript',
    label: 'Async/await + destructuring',
    code: `async function fetchUserPosts(userId) {
  const [user, posts] = await Promise.all([
    fetch(\`/api/users/\${userId}\`).then(r => r.json()),
    fetch(\`/api/users/\${userId}/posts\`).then(r => r.json()),
  ]);

  const { name, avatar } = user;
  return { name, avatar, posts: posts.slice(0, 5) };
}`,
  },

  c: {
    lang: 'c',
    label: 'Pointer arithmetic',
    code: `void reverse(char *str) {
    char *end = str;
    while (*end) end++;
    end--;

    while (str < end) {
        char tmp = *str;
        *str++ = *end;
        *end-- = tmp;
    }
}`,
  },

  cpp: {
    lang: 'cpp',
    label: 'RAII + smart pointers',
    code: `class ResourcePool {
    std::vector<std::unique_ptr<Connection>> pool_;
public:
    auto acquire() {
        if (pool_.empty())
            pool_.push_back(std::make_unique<Connection>());
        auto conn = std::move(pool_.back());
        pool_.pop_back();
        return std::shared_ptr<Connection>(
            conn.release(),
            [this](Connection* c) { pool_.emplace_back(c); }
        );
    }
};`,
  },

  php: {
    lang: 'php',
    label: 'Array functions + arrow functions',
    code: `$results = array_map(
    fn($user) => [
        'name'  => $user['name'],
        'email' => strtolower($user['email']),
        'score' => array_sum($user['grades']) / count($user['grades']),
    ],
    array_filter(
        $users,
        fn($u) => $u['active'] && count($u['grades']) > 0
    )
);`,
  },

  perl: {
    lang: 'perl',
    label: 'Regex + map',
    code: `my %word_count;
while (<STDIN>) {
    chomp;
    my @words = map { lc } /([a-z']+)/gi;
    $word_count{$_}++ for @words;
}

my @top = (sort { $word_count{$b} <=> $word_count{$a} }
           keys %word_count)[0..9];
printf "%4d %s\\n", $word_count{$_}, $_ for @top;`,
  },

  cobol: {
    lang: 'cobol',
    label: 'Procedural division',
    code: `IDENTIFICATION DIVISION.
PROGRAM-ID. PAYROLL.

DATA DIVISION.
WORKING-STORAGE SECTION.
01  WS-HOURS     PIC 9(3)V99.
01  WS-RATE      PIC 9(3)V99.
01  WS-GROSS     PIC 9(5)V99.

PROCEDURE DIVISION.
    MULTIPLY WS-HOURS BY WS-RATE
        GIVING WS-GROSS.
    DISPLAY "GROSS PAY: $" WS-GROSS.
    STOP RUN.`,
  },
};

/**
 * Look up a code snippet by language ID.
 * Returns undefined if the language has no snippet defined.
 */
export function getSnippet(languageId: string): CodeSnippet | undefined {
  return SNIPPETS[languageId];
}
