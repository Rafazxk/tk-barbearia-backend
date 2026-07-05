export interface IClientAppointment {
  id: number;

  clienteNome: string;
  clienteTelefone: string;

  dataHora: Date;

  barbeiro: {
    id: number;
    nome: string;
  };

  servicos: {
    id: number;
    nome: string;
    preco: number;
    duracaoMinutos: number;
  }[];

  totalPreco: number;
}