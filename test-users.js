const {
    findUserByUsername
} = require("./services/userService");

const {
    pool
} = require("./config/db");


async function main() {

    try {

        const user =
            await findUserByUsername("admin");


        console.log("");
        console.log("================================");
        console.log("HASIL TEST USER");
        console.log("================================");

        console.log(user);

        console.log("================================");
        console.log("");


    } catch (error) {

        console.error(
            "Gagal mengambil user:"
        );

        console.error(
            error.message
        );

    } finally {

        await pool.end();

    }

}


main();