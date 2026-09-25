export const COURSE_CSV_HEADERS = [
  "course_title",
  "course_slug",
  "course_short_description",
  "course_description",
  "course_price",
  "course_status",
  "module_order",
  "module_title",
  "module_description",
  "lesson_order",
  "lesson_title",
  "lesson_description",
  "content_type",
  "markdown_content",
  "video_url",
  "pdf_url",
  "is_free",
] as const;

const REQUIRED_HEADERS = COURSE_CSV_HEADERS.filter(
  (header) => !["module_description", "lesson_description", "video_url", "pdf_url"].includes(header)
);

export type CourseImportLesson = {
  order: number;
  title: string;
  description?: string;
  markdownContent: string;
  videoUrl?: string;
  pdfUrl?: string;
  isFree: boolean;
};

export type CourseImportModule = {
  order: number;
  title: string;
  description?: string;
  lessons: CourseImportLesson[];
};

export type CourseImportData = {
  course: {
    title: string;
    slug: string;
    shortDescription: string;
    description: string;
    price: number;
    status: "draft" | "published";
  };
  modules: CourseImportModule[];
  lessonCount: number;
  freeLessonCount: number;
};

export type CourseCsvIssue = { row?: number; message: string };
type CsvRecord = { row: number; values: string[] };

function parseRecords(source: string): { records: CsvRecord[]; issues: CourseCsvIssue[] } {
  const text = source.replace(/^\uFEFF/, "");
  const records: CsvRecord[] = [];
  const issues: CourseCsvIssue[] = [];
  let row = 1;
  let recordStart = 1;
  let values: string[] = [];
  let value = "";
  let quoted = false;
  let closedQuote = false;

  const finishValue = () => {
    values.push(value);
    value = "";
    closedQuote = false;
  };
  const finishRecord = () => {
    finishValue();
    if (values.some((item) => item.trim() !== "")) records.push({ row: recordStart, values });
    values = [];
    recordStart = row + 1;
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          value += '"';
          index += 1;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else {
        value += char;
        if (char === "\n") row += 1;
      }
      continue;
    }

    if (closedQuote && char !== "," && char !== "\r" && char !== "\n" && char.trim() !== "") {
      issues.push({ row, message: "Unexpected character after a quoted CSV field." });
      closedQuote = false;
    }
    if (char === '"') {
      if (value.length !== 0) issues.push({ row, message: "Unexpected quote inside an unquoted CSV field." });
      quoted = true;
    } else if (char === ",") {
      finishValue();
    } else if (char === "\n") {
      finishRecord();
      row += 1;
    } else if (char === "\r") {
      if (text[index + 1] !== "\n") {
        finishRecord();
        row += 1;
      }
    } else {
      value += char;
    }
  }

  if (quoted) issues.push({ row: recordStart, message: "CSV ends inside a quoted field." });
  if (values.length > 0 || value.length > 0) finishRecord();
  return { records, issues };
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateCourseCsv(csv: string): { data?: CourseImportData; issues: CourseCsvIssue[] } {
  const { records, issues } = parseRecords(csv);
  if (records.length === 0) return { issues: [...issues, { message: "CSV file is empty." }] };

  const [headerRecord, ...dataRecords] = records;
  const headers = headerRecord.values.map((header) => header.trim());
  const headerIndex = new Map<string, number>();
  headers.forEach((header, index) => {
    if (headerIndex.has(header)) issues.push({ row: headerRecord.row, message: `Duplicate header "${header}".` });
    headerIndex.set(header, index);
    if (!COURSE_CSV_HEADERS.includes(header as (typeof COURSE_CSV_HEADERS)[number])) {
      issues.push({ row: headerRecord.row, message: `Unknown header "${header}".` });
    }
  });
  for (const header of REQUIRED_HEADERS) {
    if (!headerIndex.has(header)) issues.push({ row: headerRecord.row, message: `Required header "${header}" is missing.` });
  }
  for (const header of COURSE_CSV_HEADERS) {
    if (!headerIndex.has(header) && !REQUIRED_HEADERS.includes(header)) headerIndex.set(header, -1);
  }
  if (dataRecords.length === 0) issues.push({ message: "CSV must contain at least one lesson row." });
  if (dataRecords.length === 0) return { issues };

  const valueOf = (record: CsvRecord, header: (typeof COURSE_CSV_HEADERS)[number], trim = true) => {
    const index = headerIndex.get(header) ?? -1;
    const value = index < 0 ? "" : (record.values[index] ?? "");
    return trim ? value.trim() : value;
  };
  const first = dataRecords[0];
  const courseFields = ["course_title", "course_slug", "course_short_description", "course_description", "course_price", "course_status"] as const;
  for (const record of dataRecords) {
    if (record.values.length !== headers.length) {
      issues.push({ row: record.row, message: `Expected ${headers.length} columns but found ${record.values.length}.` });
    }
    for (const field of courseFields) {
      if (valueOf(record, field) !== valueOf(first, field)) {
        issues.push({ row: record.row, message: `${field} must match the course metadata in row ${first.row}.` });
      }
    }
    for (const field of ["course_title", "course_slug", "course_short_description", "course_description", "module_order", "module_title", "lesson_order", "lesson_title", "content_type", "markdown_content", "is_free"] as const) {
      if (!valueOf(record, field)) issues.push({ row: record.row, message: `${field} is required.` });
    }
    const moduleOrder = Number(valueOf(record, "module_order"));
    if (!Number.isInteger(moduleOrder) || moduleOrder < 1) issues.push({ row: record.row, message: "module_order must be a positive integer." });
    const lessonOrder = Number(valueOf(record, "lesson_order"));
    if (!Number.isInteger(lessonOrder) || lessonOrder < 1) issues.push({ row: record.row, message: "lesson_order must be a positive integer." });
    if (valueOf(record, "content_type") !== "article") issues.push({ row: record.row, message: 'content_type must be exactly "article".' });
    if (!["true", "false"].includes(valueOf(record, "is_free"))) issues.push({ row: record.row, message: 'is_free must be exactly "true" or "false".' });
    for (const field of ["video_url", "pdf_url"] as const) {
      const url = valueOf(record, field);
      if (url && !isValidHttpUrl(url)) issues.push({ row: record.row, message: `${field} must be a valid HTTP or HTTPS URL.` });
    }
  }

  const priceText = valueOf(first, "course_price");
  const price = Number(priceText);
  if (!priceText || !Number.isFinite(price) || price < 0) issues.push({ row: first.row, message: "course_price must be a number greater than or equal to zero." });
  const status = valueOf(first, "course_status");
  if (status !== "draft" && status !== "published") issues.push({ row: first.row, message: 'course_status must be "draft" or "published".' });
  const slug = valueOf(first, "course_slug");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) issues.push({ row: first.row, message: "course_slug must use lowercase letters, numbers, and single hyphens." });

  const moduleMap = new Map<number, CourseImportModule>();
  const moduleRows = new Map<number, number>();
  const lessonOrders = new Map<number, Set<number>>();
  for (const record of dataRecords) {
    const order = Number(valueOf(record, "module_order"));
    if (!Number.isInteger(order) || order < 1) continue;
    const title = valueOf(record, "module_title");
    const description = valueOf(record, "module_description") || undefined;
    let module = moduleMap.get(order);
    if (!module) {
      module = { order, title, description, lessons: [] };
      moduleMap.set(order, module);
      moduleRows.set(order, record.row);
      lessonOrders.set(order, new Set());
    } else if (module.title !== title || (module.description ?? "") !== (description ?? "")) {
      issues.push({ row: record.row, message: `Module order ${order} has conflicting title or description (first seen on row ${moduleRows.get(order)}).` });
    }

    const lessonOrder = Number(valueOf(record, "lesson_order"));
    if (Number.isInteger(lessonOrder) && lessonOrder > 0) {
      const orders = lessonOrders.get(order)!;
      if (orders.has(lessonOrder)) issues.push({ row: record.row, message: `lesson_order ${lessonOrder} is duplicated inside module "${module.title}".` });
      orders.add(lessonOrder);
      module.lessons.push({
        order: lessonOrder,
        title: valueOf(record, "lesson_title"),
        description: valueOf(record, "lesson_description") || undefined,
        markdownContent: valueOf(record, "markdown_content", false),
        videoUrl: valueOf(record, "video_url") || undefined,
        pdfUrl: valueOf(record, "pdf_url") || undefined,
        isFree: valueOf(record, "is_free") === "true",
      });
    }
  }

  const modules = [...moduleMap.values()].sort((a, b) => a.order - b.order);
  const lessonCount = modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const freeLessonCount = modules.reduce((sum, module) => sum + module.lessons.filter((lesson) => lesson.isFree).length, 0);
  if (issues.length > 0 || !first || (status !== "draft" && status !== "published") || !Number.isFinite(price)) return { issues };
  return {
    issues,
    data: {
      course: {
        title: valueOf(first, "course_title"),
        slug,
        shortDescription: valueOf(first, "course_short_description"),
        description: valueOf(first, "course_description"),
        price,
        status,
      },
      modules: modules.map((module) => ({ ...module, lessons: module.lessons.sort((a, b) => a.order - b.order) })),
      lessonCount,
      freeLessonCount,
    },
  };
}
