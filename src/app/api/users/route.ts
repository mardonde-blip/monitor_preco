import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-adapter';
import { sendEmail, emailTemplates } from '@/lib/email';

// GET - Listar todos os usuários
export async function GET() {
  try {
    const db = await getDatabase();
    const users = await db.getAllUsers();
    return NextResponse.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error: unknown) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome_completo, email, senha, data_nascimento, sexo, celular } = body;

    // Validações básicas
    if (!nome_completo || !email || !senha || !data_nascimento || !sexo || !celular) {
      return NextResponse.json(
        { success: false, error: 'Todos os campos são obrigatórios: nome completo, email, senha, data de nascimento, sexo e celular' },
        { status: 400 }
      );
    }

    // Validar senha
    if (senha.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validar data de nascimento
    const birthDate = new Date(data_nascimento);
    const today = new Date();
    if (birthDate >= today) {
      return NextResponse.json(
        { success: false, error: 'Data de nascimento deve ser anterior à data atual' },
        { status: 400 }
      );
    }

    // Validar sexo
    if (!['Masculino', 'Feminino', 'Outro'].includes(sexo)) {
      return NextResponse.json(
        { success: false, error: 'Sexo deve ser: Masculino, Feminino ou Outro' },
        { status: 400 }
      );
    }

    // Validar celular (formato brasileiro)
    const phoneRegex = /^\(?\d{2}\)?[\s-]?9?\d{4}[\s-]?\d{4}$/;
    if (!phoneRegex.test(celular)) {
      return NextResponse.json(
        { success: false, error: 'Formato de celular inválido. Use: (11) 99999-9999 ou 11999999999' },
        { status: 400 }
      );
    }

    // Criar usuário
    const db = await getDatabase();
    const newUser = await db.createUser({
      nome_completo: nome_completo.trim(),
      email: email.toLowerCase().trim(),
      senha: senha,
      data_nascimento,
      sexo,
      celular
    });
    const typedNewUser = newUser as { id: number; nome_completo: string; email: string; [key: string]: unknown };

    // Enviar email de confirmação de cadastro
    try {
      const emailTemplate = emailTemplates.welcomeEmail(typedNewUser.nome_completo);
      await sendEmail({
        to: typedNewUser.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html
      });
      console.log(`Email de boas-vindas enviado para: ${typedNewUser.email}`);
    } catch (emailError) {
      console.error('Erro ao enviar email de boas-vindas:', emailError);
      // Não falha o cadastro se o email não for enviado
    }

    // Retornar usuário sem senha
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { senha: _senha, ...userWithoutPassword } = typedNewUser;
    // _senha é removida intencionalmente para segurança

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso! Verifique seu email.',
      data: userWithoutPassword
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Erro ao criar usuário:', error);
    
    if (error instanceof Error && error.message === 'Email já cadastrado') {
      return NextResponse.json(
        { success: false, error: 'Este email já está cadastrado' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar usuário
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nome_completo, email, data_nascimento, sexo, celular } = body;

    // Validações básicas
    if (!id || !nome_completo || !email || !data_nascimento || !sexo || !celular) {
      return NextResponse.json(
        { success: false, error: 'Todos os campos são obrigatórios: id, nome completo, email, data de nascimento, sexo e celular' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validar data de nascimento
    const birthDate = new Date(data_nascimento);
    const today = new Date();
    if (birthDate >= today) {
      return NextResponse.json(
        { success: false, error: 'Data de nascimento deve ser anterior à data atual' },
        { status: 400 }
      );
    }

    // Validar sexo
    if (!['Masculino', 'Feminino', 'Outro'].includes(sexo)) {
      return NextResponse.json(
        { success: false, error: 'Sexo deve ser: Masculino, Feminino ou Outro' },
        { status: 400 }
      );
    }

    // Validar celular (formato brasileiro)
    const celularRegexUpdate = /^\(?\d{2}\)?[\s-]?9?\d{4}[\s-]?\d{4}$/;
    if (!celularRegexUpdate.test(celular)) {
      return NextResponse.json(
        { success: false, error: 'Formato de celular inválido. Use: (11) 99999-9999 ou 11999999999' },
        { status: 400 }
      );
    }

    // Buscar usuário existente para manter a senha
    const db = await getDatabase();
    const existingUser = await db.getUserById(parseInt(id));
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const typedExistingUser = existingUser as { senha: string; telegram_id?: number; [key: string]: unknown };

    // Atualizar usuário
    const updatedUser = await db.updateUser(parseInt(id), {
      nome_completo: nome_completo.trim(),
      email: email.toLowerCase().trim(),
      data_nascimento,
      sexo,
      celular,
      senha: typedExistingUser.senha,
      telegram_id: typedExistingUser.telegram_id
    });

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: updatedUser
    });

  } catch (error: unknown) {
    console.error('Erro ao atualizar usuário:', error);
    
    if (error instanceof Error && error.message === 'Email já cadastrado') {
      return NextResponse.json(
        { success: false, error: 'Este email já está cadastrado' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar usuário
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const deleted = await db.deleteUser(parseInt(id));

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    });

  } catch (error: unknown) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}