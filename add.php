<?php

include "db.php";

if (isset($_POST['submit'])) {

    $student_id = $_POST['student_id'];
    $name = $_POST['name'];
    $course = $_POST['course'];
    $year_level = $_POST['year_level'];
    $email = $_POST['email'];

    $sql = "INSERT INTO students
            (student_id, name, course, year_level, email)
            VALUES
            ('$student_id', '$name', '$course', '$year_level', '$email')";

    mysqli_query($conn, $sql);

    header("Location: index.php");
    exit();
}

?>

<!DOCTYPE html>
<html>

<head>

    <title>Add Student</title>

    <link rel="stylesheet" href="style.css">

</head>

<body>

<div class="form-container">

    <h1>Add Student</h1>

    <form method="POST">

        <label>Student ID</label>
        <input type="text" name="student_id" required>

        <label>Name</label>
        <input type="text" name="name" required>

        <label>Course</label>
        <input type="text" name="course" required>

        <label>Year Level</label>
        <input type="number" name="year_level" min="1" max="6" required>

        <label>Email</label>
        <input type="email" name="email" required>

        <button type="submit" name="submit">
            Add Student
        </button>

    </form>

    <a href="index.php" class="back">
        Back to Students
    </a>

</div>

</body>

</html>