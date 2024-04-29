import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Cliente } from "src/shared/models/Cliente";
import { z } from "zod";
import { clientesRoute } from ".";
import { Button } from "../../../ui/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../ui/components/ui/dialog";
import { escutarCliqueTeclado } from "../../../ui/hooks/escutarCliqueTeclado";
import { InputComMascara } from "../../components/InputComMascara";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import {
  atualizarClienteApi,
  buscarClientePorId,
  cadastrarClienteApi,
} from "./comunicacaoApi";

export const clientesCadastroRoute = createRoute({
  getParentRoute: () => clientesRoute,
  path: "$clienteId",
  component: ClientesCadastro,
});

const formSchema = z.object({
  nome: z.string({ message: "Campo obrigatório." }).min(3, {
    message: "O nome do cliente não pode ser nulo.",
  }),
  celular: z
    .string({ message: "Campo obrigatório." })
    .regex(/^[(]?[0-9]{2}[)][-\s]?[9][-\s][0-9]{4}[-\s][0-9]{4}$/, {
      message: "Insira um número de celular válido.",
    }),
  email: z
    .string({ message: "Campo obrigatório." })
    .min(1, { message: "Esse campo não pode ser nulo." })
    .email("Esse email não é válido."),
  dataNascimento: z.string().nullable().optional(),
  endereco: z.string().nullable().optional(),
});

const gerarDatePorString = (dataString: string) => {
  if (dataString) {
    const [dia, mes, ano] = dataString.split("/");
    console.log(dia, mes, ano);
    return new Date(+ano, +mes - 1, +dia);
  }
  return null;
};

export const gerarStringPorData = (dataNascimento: Date) => {
  if (!dataNascimento) return null;
  const dia = String(dataNascimento.getDate()).padStart(2, "0");
  const mes = String(dataNascimento.getMonth() + 1).padStart(2, "0");
  const ano = dataNascimento.getFullYear();

  return `${dia}/${mes}/${ano}`;
};

function ClientesCadastro() {
  const clienteId: number =
    clientesCadastroRoute.useParams().clienteId === "new"
      ? null
      : Number(clientesCadastroRoute.useParams().clienteId);

  const queryClient = useQueryClient();
  const buscarcliente = (clienteId: number) =>
    useSuspenseQuery(buscarClientePorId(clienteId)).data;

  const { dataNascimento, email, endereco, nome, telefone }: Cliente = clienteId
    ? buscarcliente(clienteId)
    : { email: "", nome: "", telefone: "" };

  const navigate = useNavigate();
  const retornarParaTabela = () => navigate({ to: "/clientes/" });

  const cadastrarClienteMutation = useMutation({
    mutationFn: cadastrarClienteApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      retornarParaTabela();
    },
  });

  const atualizarClienteMutation = useMutation({
    mutationFn: atualizarClienteApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      retornarParaTabela();
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataNascimento: gerarStringPorData(dataNascimento) ?? "",
      email,
      endereco: endereco ?? "",
      nome,
      celular: telefone,
    },
  });

  function onSubmit({
    nome,
    dataNascimento: dataString,
    email,
    celular,
    endereco,
  }: z.infer<typeof formSchema>) {
    const dataNascimento = gerarDatePorString(dataString);

    const cliente: Cliente = {
      id: clienteId,
      nome,
      dataNascimento,
      email,
      telefone: celular,
      endereco,
    };
    if (clienteId) {
      atualizarClienteMutation.mutate(cliente);
      return;
    }
    cadastrarClienteMutation.mutate(cliente);
  }

  escutarCliqueTeclado(() => {
    retornarParaTabela();
  }, ["Escape"]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">
          {clienteId ? `Editar cliente ${nome}` : "Cadastrar Cliente"}
        </h1>
      </div>
      <div className="mx-auto w-9/12 max-w-[96rem] border p-4 rounded-lg">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-2 gap-3"
          >
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome*</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome Sobrenome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="celular"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Celular*</FormLabel>
                  <FormControl>
                    <InputComMascara
                      radix="."
                      mask={"(00) 0 0000-0000"}
                      placeholder="(00) 0 0000-0000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail*</FormLabel>
                  <FormControl>
                    <Input placeholder="email@gmail.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dataNascimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <InputComMascara
                      radix="."
                      mask={"00/00/0000"}
                      unmask={true}
                      placeholder="dd/mm/aaaa"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, número, bairro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="mt-2 flex gap-2 col-span-2 justify-end">
              {clienteId ? (
                <Button type="submit" className="bg-amber-500">
                  Editar
                </Button>
              ) : (
                <Button type="submit">Cadastrar</Button>
              )}
              <Button onClick={retornarParaTabela} variant="destructive">
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}

export function DialogCadastrarCliente({ isOpen }: { isOpen: boolean }) {
  const queryClient = useQueryClient();

  const refBtnClose = useRef<HTMLButtonElement>();

  const cadastrarClienteMutation = useMutation({
    mutationFn: cadastrarClienteApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      refBtnClose.current.click();
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataNascimento: "",
      email: "",
      endereco: "",
      nome: "",
      celular: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.setValue("dataNascimento", "");
      form.setValue("email", "");
      form.setValue("endereco", "");
      form.setValue("nome", "");
      form.setValue("celular", "");
    }
  }, [isOpen]);

  function onSubmit({
    nome,
    dataNascimento: dataString,
    email,
    celular,
    endereco,
  }: z.infer<typeof formSchema>) {
    const dataNascimento = dataString ? gerarDatePorString(dataString) : null;

    const cliente: Cliente = {
      nome,
      dataNascimento,
      email,
      telefone: celular,
      endereco,
    };

    cadastrarClienteMutation.mutate(cliente);
  }

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Cadastrar cliente</DialogTitle>
        <DialogDescription>
          Insira abaixo os dados do cliente.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-2 gap-3"
          >
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome*</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome Sobrenome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="celular"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Celular*</FormLabel>
                  <FormControl>
                    <InputComMascara
                      radix="."
                      mask={"(00) 0 0000-0000"}
                      placeholder="(00) 0 0000-0000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail*</FormLabel>
                  <FormControl>
                    <Input placeholder="email@gmail.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dataNascimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <InputComMascara
                      radix="."
                      mask={"00/00/0000"}
                      unmask={true}
                      placeholder="dd/mm/aaaa"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, número, bairro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="hidden" type="submit"></Button>
          </form>
        </Form>
      </div>
      <DialogFooter>
        <Button onClick={form.handleSubmit(onSubmit)} type="submit">
          Cadastrar Cliente
        </Button>
        <DialogClose asChild>
          <Button ref={refBtnClose} type="button" variant="destructive">
            Cancelar
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
}
