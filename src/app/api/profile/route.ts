import prisma from "@/lib/prisma";
import {validatePassword} from '@/lib/utils'
import {hash} from "bcrypt";
import {getServerSession} from "next-auth";
import {NextRequest, NextResponse} from "next/server";

// Update
export async function POST(request: NextRequest) {
    const json = await request.json();

    if (
        json.username == null ||
        json.dbIndicator == null ||
        json.value == null
    )
        return NextResponse.error();


    const session = await getServerSession()
    if (!session) return NextResponse.error()

    if (session.user?.name !== json.username)
        return NextResponse.error()
    
    if (json.dbIndicator == "password" && !validatePassword(json.value))
        return NextResponse.error()

    const data = {
        password: json.dbIndicator == "password" ? (await hash(json.value, 12)) : undefined,
        name: json.dbIndicator == "name" ? json.value : undefined,
        email: json.dbIndicator == "email" ? json.value : undefined,
    }

    const result = await prisma.user.update({
        where: {
            username: json.username
        },
        data: data
    })

    return NextResponse.json({result});
}