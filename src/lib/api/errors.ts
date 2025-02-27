export class CourseManagementError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'CourseManagementError';
  }
}

export const CourseErrors = {
  ARCHIVE_FAILED: new CourseManagementError(
    'Failed to archive course',
    'ARCHIVE_FAILED',
    500
  ),
  INVALID_CATEGORY: new CourseManagementError(
    'Invalid category data',
    'INVALID_CATEGORY',
    400
  ),
  TAG_EXISTS: new CourseManagementError(
    'Tag already exists',
    'TAG_EXISTS',
    409
  ),
  UPLOAD_FAILED: new CourseManagementError(
    'File upload failed',
    'UPLOAD_FAILED',
    500
  ),
  // Add more specific errors as needed
}; 