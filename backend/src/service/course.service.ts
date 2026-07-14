import { Destroy, Inject, Provide } from "@midwayjs/core";
import { DatabaseService } from "./database.service";
import { Course, CreateCourseInput } from "../interface";

type CourseRow = {
  id: number;
  title: string;
  description: string;
  created_at: string;
};

@Provide()
export class CourseService {
  @Inject()
  databaseService: DatabaseService;

  list(): Course[] {
    const db = this.databaseService.getDatabase();
    const rows = db
      .prepare(
        "SELECT id, title, description, created_at FROM courses ORDER BY id",
      )
      .all() as CourseRow[];

    return rows.map(mapCourse);
  }

  create(input: CreateCourseInput): Course {
    const db = this.databaseService.getDatabase();
    const result = db
      .prepare("INSERT INTO courses (title, description) VALUES (?, ?)")
      .run(input.title.trim(), input.description.trim());
    const row = db
      .prepare(
        "SELECT id, title, description, created_at FROM courses WHERE id = ?",
      )
      .get(result.lastInsertRowid) as CourseRow;

    return mapCourse(row);
  }
}

function mapCourse(row: CourseRow): Course {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    createdAt: new Date(`${row.created_at.replace(" ", "T")}Z`).toISOString(),
  };
}
