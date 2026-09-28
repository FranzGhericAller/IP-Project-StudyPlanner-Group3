<?php

include "db.php";

$id = $_GET['id'];

$result = mysqli_query($conn, "SELECT * FROM students WHERE id=$id");

$row = mysqli_fetch_assoc($result);

if (isset($_POST['submit'])) {

    $student_id = $_POST['student_id'];
    $name = $_POST['name'];
    $course = $_POST['course'];
    $year_level = $_POST['year_level'];
    $email = $_POST['email'];

    $sql = "UPDATE students SET
            student_id='$student_id',
            name='$name',
            course='$course',
            year_level='$year_level',
            email='$email'
            WHERE id=$id";

    mysqli_query($conn, $sql);

    header("Location: index.php");
    exit();
}

?>

<!DOCTYPE html>
<html>

<head>

    <title>Edit Student</title>

    <link rel="stylesheet" href="style.css">

</head>

<body>

<div class="form-container">

    <h1>Edit Student</h1>

    <form method="POST">

        <label>Student ID</label>

        <input type="text"
               name="student_id"
               value="<?php echo $row['student_id']; ?>"
               required>


        <label>Name</label>

        <input type="text"
               name="name"
               value="<?php echo $row['name']; ?>"
               required>


        <label>Course</label>

        <input type="text"
               name="course"
               value="<?php echo $row['course']; ?>"
               required>


        <label>Year Level</label>

        <input type="number"
               name="year_level"
               value="<?php echo $row['year_level']; ?>"
               required>


        <label>Email</label>

        <input type="email"
               name="email"
               value="<?php echo $row['email']; ?>"
               required>


        <button type="submit" name="submit">
            Update Student
        </button>

    </form>

    <a href="index.php" class="back">
        Back to Students
    </a>

</div>

</body>

</html>