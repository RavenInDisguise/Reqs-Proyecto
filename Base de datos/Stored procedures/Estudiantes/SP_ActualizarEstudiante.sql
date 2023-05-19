--------------------------------------------------------------------------
-- Autor:       Fabián Vargas
-- Fecha:       2023-05-18
-- Descripción: Procedimiento para actualizar un estudiante
--------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[BiblioTEC_SP_ActualizarEstudiante]
    @IN_idEstudiante INT,
    @IN_Nombre VARCHAR(32),
    @IN_Apellido1 VARCHAR(16),
    @IN_Apellido2 VARCHAR(16),
    @IN_Cedula INT,
    @IN_Carnet INT,
    @IN_Correo VARCHAR(128),
    @IN_FechaNacimiento DATE,
    @IN_Clave VARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;         -- No retorna metadatos

    -- CONTROL DE ERRORES
    DECLARE @ErrorNumber INT, @ErrorSeverity INT, @ErrorState INT, @Message VARCHAR(200);
    DECLARE @transaccion_iniciada BIT = 0;

    -- DECLARACIÓN DE VARIABLES
    DECLARE @idUsuario INT;

    BEGIN TRY

        -- VALIDACIONES
        IF NOT EXISTS( SELECT 1 
                       FROM [Estudiantes] E
                       WHERE E.[id] = @IN_idEstudiante) 
        BEGIN
            RAISERROR('No existe el estudiante con el ID %d', 16, 1, @IN_idEstudiante)
        END

        SELECT @idUsuario = COALESCE(E.[idUsuario], NULL)
        FROM [Estudiantes] E
        WHERE E.id = @In_idEstudiante

        -- CAMBIO DE CEDULA
        IF EXISTS ( SELECT 1
                    FROM [Estudiantes] E
                    WHERE E.[cedula] = @IN_Cedula
                    AND E.[id] !=  @IN_idEstudiante)
        BEGIN
            RAISERROR('Ya existe un estudiante con la cédula %d', 16, 1, @IN_Cedula)
        END
        -- CAMBIO DE CARNET
        IF EXISTS ( SELECT 1
                    FROM [Estudiantes] E
                    WHERE E.[carnet] = @IN_Carnet
                    AND E.[id] !=  @IN_idEstudiante)
        BEGIN
            RAISERROR('Ya existe un estudiante con el carnet %d', 16, 1, @IN_Carnet)
        END
        -- CAMBIO DE CORREO
        IF EXISTS ( SELECT 1
                    FROM [Usuarios] U
                    WHERE U.[correo] = @IN_correo
                    AND U.[id] !=  @idUsuario)
        BEGIN
            RAISERROR('Ya existe un estudiante con el correo %s', 16, 1, @IN_Correo)
        END
        -- INICIO DE LA TRANSACCIÓN
        IF @@TRANCOUNT = 0
        BEGIN
            SET @transaccion_iniciada = 1;
            BEGIN TRANSACTION;
        END;

        UPDATE Estudiantes
        SET Nombre = @IN_Nombre,
            Apellido1 = @IN_Apellido1,
            Apellido2 = @IN_Apellido2,
            Cedula = @IN_Cedula,
            Carnet = @IN_Carnet,
            fechaDeNacimiento = @IN_FechaNacimiento
        WHERE id = @IN_idEstudiante

        IF(@IN_Clave = '')
        BEGIN
            UPDATE Usuarios
            SET correo = @IN_Correo
            WHERE ID = @idUsuario
        END
        ELSE
        BEGIN
            UPDATE Usuarios
            SET correo = @IN_Correo,
                clave = @IN_Clave
            WHERE ID = @idUsuario
        END

        -- COMMIT DE LA TRANSACCIÓN
        IF @transaccion_iniciada = 1
        BEGIN
            COMMIT TRANSACTION;
        END;

    END TRY
    BEGIN CATCH

        SET @ErrorNumber = ERROR_NUMBER();
        SET @ErrorSeverity = ERROR_SEVERITY();
        SET @ErrorState = ERROR_STATE();
        SET @Message = ERROR_MESSAGE();

        IF @transaccion_iniciada = 1
        BEGIN
            ROLLBACK;
        END;

        IF @ErrorNumber != 50000
        BEGIN
            -- Si no es un error personalizado, se registra el error
            INSERT INTO [dbo].[Errors]
            VALUES (
                SUSER_NAME(),
                ERROR_NUMBER(),
                ERROR_STATE(),
                ERROR_SEVERITY(),
                ERROR_LINE(),
                ERROR_PROCEDURE(),
                ERROR_MESSAGE(),
                GETUTCDATE()
            );
        END;

        RAISERROR('%s - Error Number: %i', 
            @ErrorSeverity, @ErrorState, @Message, @ErrorNumber);

    END CATCH;
END;