import { Button } from "@/components/ui/button";
import Link from "next/link";

// In your course list rendering
{courses.map((course) => (
  <TableRow key={course.id}>
    {/* ... other columns */}
    <TableCell>
      <Button asChild variant="ghost">
        <Link href={`/lecturer/courses/${course.id}`}>
          View Details
        </Link>
      </Button>
    </TableCell>
  </TableRow>
))} 