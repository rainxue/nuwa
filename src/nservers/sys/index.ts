

export function register_nserver_services() {
}

class NHostService {
  constructor() {
    // Initialization logic for NHostService
  }

  async test() {
    console.log("NHostService test method called");
    // Logic to start the service
    return { message: "NHostService is running"  };
  }

  async list() {
    return [];
  }
}

export const nhost_service = new NHostService();