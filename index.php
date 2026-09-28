<?php

include "db.php";

$result = mysqli_query($conn, "SELECT * FROM students");

?>

<!DOCTYPE html>
<html>
<head>
    <title>Student Management System</title>
    <link rel="stylesheet" href="style.css">
</head>

<body>

<div class="container">

    <h1>Student Management System</h1>

    <a href="add.php" class="add-button">+ Add Student</a>

    <table>

        <tr>
            <th>ID</th>
            <th>Student ID</th>
            <th>Name</th>
            <th>Course</th>
            <th>Year</th>
            <th>Email</th>
            <th>Action</th>
        </tr>

        <?php while ($row = mysqli_fetch_assoc($result)) { ?>

        <tr>

            <td><?php echo $row['id']; ?></td>

            <td><?php echo $row['student_id']; ?></td>

            <td><?php echo $row['name']; ?></td>

            <td><?php echo $row['course']; ?></td>

            <td><?php echo $row['year_level']; ?></td>

            <td><?php echo $row['email']; ?></td>

            <td>
                <a href="edit.php?id=<?php echo $row['id']; ?>" class="edit">
                    Edit
                </a>

                <a href="delete.php?id=<?php echo $row['id']; ?>"
                   class="delete"
                   onclick="return confirm('Are you sure you want to delete this student?');">
                    Delete
                </a>
            </td>

        </tr>

        <?php } ?>

    </table>

</div>

</body>
</html>